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
          const req = request
            .get(next)
            .set('Authorization', `token ${this._token}`)
          return this._fetchUntilFinished(req, merged, merge)
        } else {
          log('fetched last page - %d results', merged.length)
          return merged
        }
      })
  }

  fetchIssuesSince(date) {
    const url = `${this.url}/issues`
    const since = date.toISOString()
    log(`fetching results since ${since}`, url)

    const query = request
      .get(url)
      .query({since, state: 'all'})
      .set('Authorization', `token ${this._token}`)
    return this._fetchUntilFinished(query, [])
  }

  addComment(issue, comment) {
    const url = `${this.url}/issues/${issue.number}/comments`
    if (this._dryRun) {
      log('dry run, skipping', url)
      return Promise.resolve()
    }

    return request
      .post(url)
      .set('Authorization', `token ${this._token}`)
      .type('json')
      .send({body: comment})
      .promise()
  }

  addLabel(issue, label) {
    const url = `${this.url}/issues/${issue.number}`
    if (this._dryRun) {
      log('dry run, skipping', url)
      return Promise.resolve()
    }

    const labels = issue.labels.map(l => l.name).concat(label)
    return request
      .patch(url)
      .set('Authorization', `token ${this._token}`)
      .type('json')
      .send({labels})
      .promise()
  }

  closeIssue(issue) {
    const url = `${this.url}/issues/${issue.number}`
    if (this._dryRun) {
      log('dry run, skipping', url)
      return Promise.resolve()
    }

    return request
      .patch(url)
      .set('Authorization', `token ${this._token}`)
      .type('json')
      .send({state: 'closed'})
      .promise()
  }
}

module.exports = GitHubApi
