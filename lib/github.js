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
          const req = request
            .get(next)
            .set('Authorization', `token ${this._token}`)
          return this._fetchUntilFinished(req, merged, merge)
        } else {
          return merged
        }
      })
  }

  fetchIssuesSince(date) {
    const query = request
      .get(`${this.url}/issues`)
      .query({since: date.toISOString(), state: 'all'})
      .set('Authorization', `token ${this._token}`)
    return this._fetchUntilFinished(query, [])
  }

  addComment(issue, comment) {
    if (this._dryRun) {
      return Promise.resolve()
    }

    return request
      .post(`${this.url}/issues/${issue.number}/comments`)
      .set('Authorization', `token ${this._token}`)
      .type('json')
      .send({body: comment})
      .promise()
  }

  addLabel(issue, label) {
    if (this._dryRun) {
      return Promise.resolve()
    }

    const labels = issue.labels.map(l => l.name).concat(label)
    return request
      .patch(`${this.url}/issues/${issue.number}`)
      .set('Authorization', `token ${this._token}`)
      .type('json')
      .send({labels})
      .promise()
  }

  closeIssue(issue) {
    if (this._dryRun) {
      return Promise.resolve()
    }

    return request
      .patch(`${this.url}/issues/${issue.number}`)
      .set('Authorization', `token ${this._token}`)
      .type('json')
      .send({state: 'closed'})
      .promise()
  }
}

module.exports = GitHubApi
