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

module.exports = LabelFilter
