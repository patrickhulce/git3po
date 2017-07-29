#!/usr/bin/env node

const path = require('path')
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
const github = new GitHubApi('', config.repo, false)

/* eslint-disable no-console */
github.fetchIssuesSince(config.startAt)
  .then(console.log)
  .catch(console.error)

