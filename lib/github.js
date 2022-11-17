const log = require('debug')('git3po:github')
const logF = require('debug')('git3po:fetch')
const os = require('os');

var parseLink = require('parse-link-header');
const fetch = require('make-fetch-happen').defaults({
  cachePath:  `${os.homedir()}/.cache/make-fetch-happen-git3po`, // path where cache will be written (and read)
})


class GitHubApi {
  constructor(url, token, repo, dryRun) {
    this._url = url
    this._token = token
    this._repo = repo
    this._dryRun = dryRun
  }

  get url() {
    return `${this._url}/repos/${this._repo}`
  }

  _authenticatedRequest(url, queryObj = {}, method = 'get', postPayload) {
    const params = new URLSearchParams(Object.entries(queryObj));
    
    const urlObj = new URL(url);
    urlObj.search = params.toString();
    logF('params', queryObj, params.toString())
    const body = postPayload ? JSON.stringify(postPayload) : undefined;

    logF(`[${method}] ${urlObj.toString()}`, body);

    return fetch(urlObj.toString(), {
      method,
      headers: {'Authorization':  `token ${this._token}`},
      body,
    })
    // TODO log out non 200s, etc.
  }

  async * _fetchUntilFinished(responsePromise, onEach) {
    let merged = []
    let pages = 0
    while (responsePromise) {
      pages++

      log('fetching page %d - %d results so far', pages, merged.length)
      const response = await responsePromise // eslint-disable-line no-await-in-loop
      const body = await response.json()
      const linkHeader = response.headers.get('link');
      const next = linkHeader && parseLink(linkHeader)?.next?.url;

      if (onEach) {
        await onEach(body) // eslint-disable-line no-await-in-loop
      }

      await (yield body) // eslint-disable-line no-await-in-loop
      merged = merged.concat(body)
      responsePromise = next ? this._authenticatedRequest(next) : null
    }

    log('fetched %d pages - %d total results', pages, merged.length)
    return merged
  }

  fetchIssuesSince(date, state = 'all') {
    const url = `${this.url}/issues`
    const since = date.toISOString()
    log(`fetching issues since=${since} state=${state}`)

    const responsePromise = this._authenticatedRequest(url, {since, state})
    return this._fetchUntilFinished(responsePromise)
  }

  fetchPullRequestsSince(date, state = 'all') {
    const url = `${this.url}/pulls`
    const since = date.toISOString()
    log(`fetching PRs since=${since} state=${state}`)

    const responsePromise = this._authenticatedRequest(url, {since, state})
    return this._fetchUntilFinished(responsePromise, async pullsArr => {
      for (const prItem of pullsArr) {
        const index = pullsArr.indexOf(prItem)
        const pr = await this.fetchPullRequest(prItem.number)
        const issue = await this.fetchIssue(prItem.number)
        pullsArr[index] = Object.assign({}, issue, pr)
      }
    })
  }

  async fetchPullRequest(number) {
    const url = `${this.url}/pulls/${number}`
    log(`fetching pr #${number}`)
    const response = await this._authenticatedRequest(url)
    return response.json()
  }

  async fetchIssue(number) {
    const url = `${this.url}/issues/${number}`
    log(`fetching issue #${number}`)
    const response = await this._authenticatedRequest(url)
    return response.json()
  }

  async fetchComments(issue) {
    const url = `${this.url}/issues/${issue.number}/comments`
    log(`fetching comments for issue=${issue.number}`)
    const response = await this._authenticatedRequest(url).then(r => r.json())

    if (issue.pull_request) {
      log(`fetching comments for PR=${issue.number}`)
      const reviewCommentsUrl = url.replace('/issues/', '/pulls/')
      const reviewResponseJson = await (await this._authenticatedRequest(reviewCommentsUrl)).json()
      return response.concat(reviewResponseJson)
    } else {
      return response
    }
  }

  async fetchCommits(pullRequest) {
    const url = `${this.url}/pulls/${pullRequest.number}/commits`
    log(`fetching commits for PR=${pullRequest.number}`)
    const response = await this._authenticatedRequest(url)
    return response.json()
  }

  // Only make this request if --dry-run is not set
  async dryRunGuardedRequest(url, method, postPayload) {
    if (this._dryRun) {
      log(`dry run, skipping ${method.toUpperCase()} request to ${url}`)
      return Promise.resolve()
    }

    const result = await this._authenticatedRequest(`${this.url}${url}`, undefined, method, postPayload)
    log(`received successful response from ${url}`)
    return result
  }

  addComment(issue, comment) {
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}/comments`,
      'post',
      {body: comment},
    )
  }

  addLabel(issue, label) {
    const labels = issue.labels.map(l => l.name).concat(label)
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}`,
      'patch',
      {labels},
    ).then(response => {
      issue.labels.push({name: label})
      return response
    })
  }

  removeLabel(issue, label) {
    const labels = issue.labels.map(l => l.name).filter(name => name !== label)
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}`,
      'patch',
      {labels},
    ).then(response => {
      issue.labels = issue.labels.filter(l => l.name !== label)
      return response
    })
  }

  addAssignee(issue, assignee) {
    const assignees = issue.assignees.map(l => l.login).concat(assignee)
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}`,
      'patch',
      {assignees},
    ).then(response => {
      issue.assignees.push({login: assignee})
      return response
    })
  }

  closeIssue(issue) {
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}`,
      'patch',
      {state: 'closed'},
    )
  }

  lockIssue(issue, lockReason) {
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}/lock`,
      'put',
      // eslint-disable-next-line camelcase
      {lock_reason: lockReason || 'resolved'},
    )
  }

  mergePullRequest(pr, mergeMethod, title, message) {
    return this.dryRunGuardedRequest(
      `/pulls/${pr.number}/merge`,
      'put',
      /* eslint-disable camelcase */
      {
        sha: pr.head.sha,
        merge_method: mergeMethod || 'rebase',
        commit_title: title,
        commit_message: message,
      }
      /* eslint-enable camelcase */
    );
  }

  static transformIssue(issue) {
    return {
      text: [issue.title, issue.body].join('\n'),
      title: issue.title,
      body: issue.body,
      state: issue.state,
      locked: issue.locked,
      author: issue.user && issue.user.login,
      mergeable: issue.mergeable,
      mergeableState: issue.mergeable_state,
      reviewers: (issue.requested_reviewers || []).map(reviewer => reviewer.login),
      assignees: (issue.assignees || []).map(assignee => assignee.login),
      labels: (issue.labels || []).map(label => label.name),
      createdAt: new Date(issue.created_at),
      updatedAt: new Date(issue.updated_at),
    }
  }

  static transformCommentOrCommit(item) {
    return item.commit ?
      GitHubApi.transformCommit(item) :
      GitHubApi.transformComment(item)
  }

  static transformComment(comment) {
    return {
      type: 'comment',
      text: comment.body,
      author: comment.user.login,
      createdAt: new Date(comment.created_at),
    }
  }

  static transformCommit(commit) {
    return {
      type: 'commit',
      text: commit.commit.message,
      author: commit.author.login,
      createdAt: new Date(commit.commit.committer.date),
    }
  }
}

module.exports = GitHubApi
