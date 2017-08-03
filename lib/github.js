const log = require('debug')('git3po:github')
const request = require('superagent-bluebird-promise')

const GITHUB_URL = 'https://api.github.com'

class GitHubApi {
  constructor(token, repo, dryRun) {
    this._token = token
    this._repo = repo
    this._dryRun = dryRun
  }

  get url() {
    return `${GITHUB_URL}/repos/${this._repo}`
  }

  _authenticatedRequest(url, method = 'get') {
    return request[method](url).set('Authorization', `token ${this._token}`)
  }

  async *_fetchUntilFinished(request) {
    let merged = []
    let pages = 0
    while (request) {
      pages++

      log('fetching page %d - %d results so far', pages, merged.length)
      const response = await request
      const body = response.body
      const next = response.links && response.links.next

      await (yield body)
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
    )
  }

  closeIssue(issue) {
    return this.dryRunGuardedRequest(
      `/issues/${issue.number}`,
      'patch',
      request => request.type('json').send({state: 'closed'})
    )
  }
}

module.exports = GitHubApi
