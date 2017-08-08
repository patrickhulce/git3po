require('colors')

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

  return github.fetchIssuesSince(config.startAt, state)
}

async function git3po(options) {
  const {log, configPath, dryRun} = options
  const config = Config.from(configPath)
  const filters = config.filters
  const actions = config.actions

  const github = new GitHubApi(config.token, config.repo, dryRun)

  const issuePager = await fetchIssues(config, github)
  for await (const issues of issuePager) {
    for (const issue of issues) {
      let passes = true
      for (const filter of filters) {
        // eslint-disable-next-line no-await-in-loop
        passes = await filter.apply(issue, github)
        if (!passes) {
          const issueMsg = `Issue #${issue.number}`
          log(`${'⤺'.yellow}  ${issueMsg} did not match ${filter.toLog()} filter, skipping`)
          break
        }
      }

      if (!passes) {
        continue
      }

      const startMsgDesc = `(${issue.title}) at ${issue.created_at}`
      log(`💎  Found #${issue.number} ${startMsgDesc}, processing...`)
      log(`🔗  https://github.com/${config.repo}/issues/${issue.number}`)

      for (const action of actions) {
        const actionLog = _.padEnd(`     Applying ${action.toLog()}...`, 40)
        log(actionLog, '⏳')

        // eslint-disable-next-line no-await-in-loop
        await action.apply(issue, github)
      }

      log(`✅  Done with #${issue.number}`)
    }
  }
}

module.exports = {git3po, fetchIssues}
