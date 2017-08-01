const Filter = require('../filter')

class LabelFilter extends Filter {
  _apply(issue) {
    const label = this._filter.label
    return issue.labels.some(labelInfo => labelInfo.name === label)
  }
}

module.exports = LabelFilter
