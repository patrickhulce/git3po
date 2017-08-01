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

  _fetchUntilFinished(promise, acculmator, merge) {
    if (!merge) {
      merge = (x, y) => x.concat(y)
    }

    return promise
      .then(response => {
        const body = response.body
        const next = response.links && response.links.next
        const merged = merge(acculmator, body)
        if (next) {
          log('fetching next page', next)
          const req = this._authenticatedRequest(next)
          return this._fetchUntilFinished(req, merged, merge)
        } else {
          log('fetched last page - %d results', merged.length)
          return merged
        }
      })
  }

  fetchIssuesSince(date, state = 'all') {
    const url = `${this.url}/issues`
    const since = date.toISOString()
    log(`fetching results since ${since}`, url)

    const query = this._authenticatedRequest(url)
      .query({since, state})
    return this._fetchUntilFinished(query, [])
  }

  _authenticatedRequest(url, method = 'get') {
    return request[method](url).set('Authorization', `token ${this._token}`)
  }

  _guardedRequest(url, method, action) {
    if (this._dryRun) {
      log(`dry run, skipping ${method.toUpperCase()} request to ${url}`)
      return Promise.resolve()
    }

    const mutatedRequest = action(this._authenticatedRequest(url, method))
    return mutatedRequest
      .then(value => {
        log(`received successful response from ${url}`)
        return value
      })
  }

  addComment(issue, comment) {
    return this._guardedRequest(
      `${this.url}/issues/${issue.number}/comments`,
      'post',
      request => request.type('json').send({body: comment})
    )
  }

  addLabel(issue, label) {
    const labels = issue.labels.map(l => l.name).concat(label)
    return this._guardedRequest(
      `${this.url}/issues/${issue.number}`,
      'patch',
      request => request.type('json').send({labels})
    )
  }

  closeIssue(issue) {
    return this._guardedRequest(
      `${this.url}/issues/${issue.number}`,
      'patch',
      request => request.type('json').send({state: 'closed'})
    )
  }
}

module.exports = GitHubApi
