const fs = require('fs')
const yaml = require('js-yaml')
const Action = require('./action')
const Filter = require('./filter')

class Config {
  constructor(config) {
    this._config = config
  }

  get token() {
    return this._config.token
  }

  get repo() {
    return this._config.repo
  }

  get startAt() {
    return new Date(this._config.startAt)
  }

  get filters() {
    return this._config.filters.map(Filter.from)
  }

  get actions() {
    return this._config.actions
      .map(action => new Action(action))
  }

  static from(path) {
    const contents = fs.readFileSync(path, 'utf8')
    if (contents.trim().charAt(0) === '{') {
      return new Config(JSON.parse(contents))
    } else {
      return new Config(yaml.safeLoad(contents))
    }
  }
}

module.exports = Config
