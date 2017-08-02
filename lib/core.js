const _ = require('lodash')
const Filter = require('./filter')
const Config = require('./config')
const GitHubApi = require('./github')

async function fetchIssues(config, github) {
  const stateFilter = config.filters.find(filter => filter.type === Filter.TYPES.STATE)

  let state = 'all'
  if (stateFilter) {
    state = stateFilter.apply({state: 'open'}) ? 'open' : 'closed'
  }

  return await github.fetchIssuesSince(config.startAt, state)
}

async function git3po(options) {
  const {log, configPath, dryRun} = options
  const config = Config.from(configPath)
  const filters = config.filters
  const actions = config.actions

  const github = new GitHubApi(config.token, config.repo, dryRun)

  const issues = await fetchIssues(config, github)
  const filterIssue = issue => filters.every(filter => filter.apply(issue))
  const filteredIssues = issues.filter(filterIssue)

  for (const issue of filteredIssues) {
    const startMsgDesc = `(${issue.title}) at ${issue.created_at}`
    log(`💎  Found #${issue.number} ${startMsgDesc}, processing...`)

    for (const action of actions) {
      const actionLog = _.padEnd(`     Applying ${action.toLog()}...`, 40)
      log(actionLog, '⏳')

      await action.apply(github, issue)
    }

    log(`✅  Done with #${issue.number}`)
  }
}

module.exports = {git3po, fetchIssues}