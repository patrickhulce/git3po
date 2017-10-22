const util = require('util')
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

StateFilter.prototype._apply = util.deprecate(
  StateFilter.prototype._apply,
  'state filter is deprecated, use issue filter'
)
module.exports = StateFilter
