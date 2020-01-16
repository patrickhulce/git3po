const fs = require('fs')
const yaml = require('js-yaml')
const Action = require('./action')
const Filter = require('./filter')

class Config {
  constructor(config) {
    this._config = config
  }

  get githubApiBaseUrl() {
    return this._config.githubApiBaseUrl || 'https://api.github.com'
  }

  get token() {
    return process.env.GIT3PO_GH_TOKEN || this._config.token
  }

  get repo() {
    return this._config.repo
  }

  get pullRequests() {
    return this._config.pullRequests || false
  }

  get startAt() {
    return new Date(this._config.startAt)
  }

  get filters() {
    return this._config.filters.map(Filter.from)
  }

  get actions() {
    return this._config.actions.map(Action.from)
  }

  static from(path, overrides) {
    const contents = fs.readFileSync(path, 'utf8')

    let _config;
    if (contents.trim().charAt(0) === '{') {
      _config = JSON.parse(contents)
    } else {
      _config = yaml.safeLoad(contents)
    }

    return new Config({..._config, ...overrides})
  }
}

module.exports = Config
