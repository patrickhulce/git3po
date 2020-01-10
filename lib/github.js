const log = require('debug')('git3po:github')
const Promise = require('bluebird')
const request = require('superagent-bluebird-promise')

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

  _authenticatedRequest(url, method = 'get') {
    return request[method](url).set('Authorization', `token ${this._token}`)
  }

  async * _fetchUntilFinished(request, onEach) {
    let merged = []
    let pages = 0
    while (request) {
      pages++

      log('fetching page %d - %d results so far', pages, merged.length)
      const response = await request // eslint-disable-line no-await-in-loop
      const body = response.body
      const next = response.links && response.links.next

      if (onEach) {
        await onEach(body) // eslint-disable-line no-await-in-loop
      }

      await (yield body) // eslint-disable-line no-await-in-loop
      merged = merged.concat(body)
      request = next ? this._authenticatedRequest(next).promise() : null
    }

    log('fetched %d pages - %d total results', pages, merged.length)
    return merged
  }

  fetchIssuesSince(date, state = 'all') {
    const url = `${this.url}/issues`
    const since = date.toISOString()
    log(`fetching issues since=${since} state=${state}`)

    const query = this._authenticatedRequest(url)
      .query({since, state})
      .promise()
    return this._fetchUntilFinished(query)
  }

  fetchPullRequestsSince(date, state = 'all') {
    const url = `${this.url}/pulls`
    const since = date.toISOString()
    log(`fetching PRs since=${since} state=${state}`)

    const query = this._authenticatedRequest(url)
      .query({since, state})
      .promise()
    return this._fetchUntilFinished(query, page => {
      return Promise.map(page, async prItem => {
        const index = page.indexOf(prItem)
        const pr = await this.fetchPullRequest(prItem.number)
        const issue = await this.fetchIssue(prItem.number)
        page[index] = Object.assign({}, issue, pr)
      })
    })
  }

  async fetchPullRequest(number) {
    const url = `${this.url}/pulls/${number}`
    log(`fetching pr #${number}`)
    const response = await this._authenticatedRequest(url).promise()
    return response.body
  }

  async fetchIssue(number) {
    const url = `${this.url}/issues/${number}`
    log(`fetching issue #${number}`)
    const response = await this._authenticatedRequest(url).promise()
    return response.body
  }

  async fetchComments(issue) {
    const url = `${this.url}/issues/${issue.number}/comments`
    log(`fetching comments for issue=${issue.number}`)
    const response = await this._authenticatedRequest(url).promise()

    if (issue.pull_request) {
      log(`fetching comments for PR=${issue.number}`)
      const reviewCommentsUrl = url.replace('/issues/', '/pulls/')
      const reviewResponse = await this._authenticatedRequest(reviewCommentsUrl).promise()
      return response.body.concat(reviewResponse.body)
    } else {
      return response.body
    }
  }

  async fetchCommits(pullRequest) {
    const url = `${this.url}/pulls/${pullRequest.number}/commits`
    log(`fetching commits for PR=${pullRequest.number}`)
    const response = await this._authenticatedRequest(url).promise()
    return response.body
  }

  async dryRunGuardedRequest(url, method, action) {
    if (this._dryRun) {
      log(`dry run, skipping ${method.toUpperCase()} request to ${url}`)
      return Promise.resolve()
    }

    let promiseLike = action(
      this._authenticatedRequest(`${this.url}${url}`, method)
    )
    if (typeof promiseLike.promise === 'function') {
      promiseLike = promiseLike.promise()
    }

    const result = await promiseLike
    log(`received successful response from ${url}`)
    return result
  }

  addComment(issue, comment) {
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}/comments`,
      'post',
      request => request.type('json').send({body: comment})
    )
  }

  addLabel(issue, label) {
    const labels = issue.labels.map(l => l.name).concat(label)
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}`,
      'patch',
      request => request.type('json').send({labels})
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
      request => request.type('json').send({labels})
    ).then(response => {
      issue.labels = issue.labels.filter(l => l.name !== label)
      return response
    })
  }

  closeIssue(issue) {
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}`,
      'patch',
      request => request.type('json').send({state: 'closed'})
    )
  }

  lockIssue(issue, lockReason) {
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}/lock`,
      'put',
      // eslint-disable-next-line camelcase
      request => request.type('json').send({lock_reason: lockReason || 'resolved'})
    )
  }

  mergePullRequest(pr, mergeMethod, title, message) {
    return this.dryRunGuardedRequest(
      `/pulls/${pr.number}/merge`,
      'put',
      /* eslint-disable camelcase */
      request => request.type('json').send({
        sha: pr.head.sha,
        merge_method: mergeMethod || 'rebase',
        commit_title: title,
        commit_message: message,
      })
      /* eslint-enable camelcase */
      )
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
      labels: (issue.labels || []).map(label => label.name),
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
