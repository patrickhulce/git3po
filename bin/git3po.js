#!/usr/bin/env node

const path = require('path')
const yargs = require('yargs')
const git3po = require('../dist/core').git3po

const argv = yargs
  .usage('Usage: $0 [options]')
  .options('config', {
    alias: 'c',
    describe: 'The config file to use',
  })
  .options('start-at', {
    alias: 's',
    describe: 'Date to start at, unix timestamp',
  })
  .options('dry-run', {
    describe: 'Will not actually make changes',
    default: false,
  })
  .demandOption('config')
  .help()
  .argv

function log(...args) {
  // eslint-disable-next-line no-console
  console.log(...args)
}

function error(...args) {
  // eslint-disable-next-line no-console
  console.error(...args)
}

const configPath = path.resolve(process.cwd(), argv.config)
git3po(Object.assign({configPath, log}, argv))
  .then(() => log('🎉  Finished!'))
  .catch(err => error(`💣  Fatal error: ${err.stack}`) || process.exit(1))

