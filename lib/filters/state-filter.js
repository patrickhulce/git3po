const Filter = require('../filter')

class StateFilter extends Filter {
  get type() {
    return Filter.TYPES.STATE
  }

  _apply(issue) {
    const state = this._filter.state
    return issue.state === state
  }
}

module.exports = StateFilter
