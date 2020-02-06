require('colors')

const _ = require('lodash')
const Filter = require('./filter')
const Config = require('./config')
const GitHubApi = require('./github')

function determineFetchState(config) {
  let state = 'all'

  const stateFilter = config.filters.find(filter => filter.type === Filter.TYPES.STATE)
  const issueFilter = config.filters.find(filter => filter.type === Filter.TYPES.ISSUE)
  const stateCondition = _.get(issueFilter, ['_filter', 'criteria', 'state'])
  if (stateFilter) {
    state = stateFilter.apply({state: 'open'}) ? 'open' : 'closed'
  } else if (typeof stateCondition === 'string') {
    state = stateCondition
  }

  return state
}

async function fetchIssues(config, github) {
  const state = determineFetchState(config)
  return config.pullRequests ?
    github.fetchPullRequestsSince(config.startAt, state) :
    github.fetchIssuesSince(config.startAt, state)
}

async function git3po(options) {
  const {log, configPath, dryRun} = options

  const configOverrides = {}
  if (options.startAt !== undefined) {
    configOverrides.startAt = options.startAt
  }
  const config = Config.from(configPath, configOverrides)

  const filters = config.filters
  const actions = config.actions

  const github = new GitHubApi(config.githubApiBaseUrl, config.token, config.repo, dryRun)

  const issuePager = await fetchIssues(config, github)
  for await (const issues of issuePager) {
    for (const issue of issues) {
      let passesFilters = true
      for (const filter of filters) {
        // eslint-disable-next-line no-await-in-loop
        passesFilters = await filter.apply(issue, github)
        if (!passesFilters) {
          const issueMsg = `Issue #${issue.number}`
          log(`${'⤺'.yellow}  ${issueMsg} did not match ${filter.toLog()} filter, skipping`)
          break
        }
      }
      if (!passesFilters) continue

      if (config.pullRequests === false && issue.pull_request) {
        const issueMsg = `Issue #${issue.number}`
        log(`${'⤺'.yellow}  ${issueMsg} is a pull request, skipping`)
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
