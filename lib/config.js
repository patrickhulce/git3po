const fs = require('fs')
const yaml = require('js-yaml')

class Config {
  constructor(config) {
    this._config = config
  }

  get repo() {
    return this._config.repo
  }

  get startAt() {
    return new Date(this._config.startAt)
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
