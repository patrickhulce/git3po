const Filter = require('../filter')

class StateFilter extends Filter {
  _apply(issue) {
    const state = this._filter.state
    return issue.state === state
  }
}

module.exports = StateFilter
