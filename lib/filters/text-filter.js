const Filter = require('../filter')

class TextFilter extends Filter {
  get type() {
    return Filter.TYPES.TEXT
  }

  _apply(issue) {
    const text = this._filter.text.toLowerCase()
    return issue.body.toLowerCase().includes(text) ||
      issue.title.toLowerCase().includes(text)
  }
}

module.exports = TextFilter
