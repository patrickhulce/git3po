const util = require('util')
const Filter = require('../filter')

class LabelFilter extends Filter {
  get type() {
    return Filter.TYPES.LABEL
  }

  _apply(issue) {
    const label = this._filter.label
    return issue.labels.some(labelInfo => labelInfo.name === label)
  }
}

LabelFilter.prototype._apply = util.deprecate(
  LabelFilter.prototype._apply,
  'label filter is deprecated, use issue filter'
)
module.exports = LabelFilter
