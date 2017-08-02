const _ = require('lodash')
const Filter = require('./filter')
const Config = require('./config')
const GitHubApi = require('./github')

function git3po(options) {
  const {log, configPath, dryRun} = options
  const config = Config.from(configPath)
  const filters = config.filters
  const actions = config.actions

  const github = new GitHubApi(config.token, config.repo, dryRun)

  function fetchIssues() {
    const stateFilter = filters.find(filter => filter.type === Filter.TYPES.STATE)

    let state = 'all'
    if (stateFilter) {
      state = stateFilter.apply({state: 'open'}) ? 'open' : 'closed'
    }

    return github.fetchIssuesSince(config.startAt, state)
  }

  return fetchIssues()
    .then(issues => {
      const filterIssue = issue => filters.every(filter => filter.apply(issue))
      const filteredIssues = issues.filter(filterIssue)

      const applyActions = (promise, issue) => {
        const startMsgDesc = `(${issue.title}) at ${issue.created_at}`
        const startMsg = `💎  Found #${issue.number} ${startMsgDesc}, processing...`
        const endMsg = `✅  Done with #${issue.number}`

        return actions.reduce((promise, action) => {
          const actionLog = _.padEnd(`     Applying ${action.toLog()}...`, 40)
          return promise
            .then(() => log(actionLog, '⏳'))
            .then(() => action.apply(github, issue))
        }, promise.then(() => log(startMsg))).then(() => log(endMsg))
      }

      return filteredIssues.reduce(applyActions, Promise.resolve())
    })
}

module.exports = git3po
