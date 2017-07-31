#!/usr/bin/env node

const path = require('path')
const _ = require('lodash')
const yargs = require('yargs')
const Config = require('./config')
const GitHubApi = require('./github')

const argv = yargs
  .usage('Usage: $0 [options]')
  .options('config', {
    alias: 'c',
    describe: 'The config file to use',
  })
  .options('dry-run', {
    describe: 'Will not actually make changes',
    default: false,
  })
  .demandOption('config')
  .help()
  .argv

const configPath = path.join(process.cwd(), argv.config)
const config = Config.from(configPath)
const github = new GitHubApi(config.token, config.repo, argv.dryRun)

/* eslint-disable no-console */
github.fetchIssuesSince(config.startAt)
  .then(issues => {
    const filterIssue = issue => config.filters.every(filter => filter.apply(issue))
    const filteredIssues = issues.filter(filterIssue)

    const applyActions = (promise, issue) => {
      const startMsg = `💎  Found #${issue.number} (${issue.title}) at ${issue.created_at}, processing...`
      const endMsg = `✅  Done with #${issue.number}`

      return config.actions.reduce((promise, action) => {
        const actionLog = _.padEnd(`     Applying ${action.toLog()}...`, 40)
        return promise
          .then(() => console.log(actionLog, '⏳'))
          .then(() => action.apply(github, issue))
      }, promise.then(() => console.log(startMsg))).then(() => console.log(endMsg))
    }

    return filteredIssues.reduce(applyActions, Promise.resolve())
  })
  .catch(console.error)

