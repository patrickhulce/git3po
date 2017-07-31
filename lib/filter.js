class Filter {
  constructor(filter) {
    this._filter = filter
  }

  static get TYPES() {
    return {
      TEXT: 'text',
      LABEL: 'label',
      STATE: 'state',
    }
  }

  apply(issue) {
    let applies = false

    switch (this._filter.type) {
      case Filter.TYPES.TEXT: {
        const text = this._filter.text.toLowerCase()
        applies = issue.body.toLowerCase().includes(text) ||
          issue.title.toLowerCase().includes(text)
        break
      }
      case Filter.TYPES.LABEL: {
        const label = this._filter.label
        applies = issue.labels.some(labelInfo => labelInfo.name === label)
        break
      }
      case Filter.TYPES.STATE: {
        const state = this._filter.state
        applies = issue.state === state
        break
      }
      default:
        throw new TypeError(`Unknown filter type: ${this._filter.type}`)
    }

    return this._filter.negate ? !applies : applies
  }
}

module.exports = Filter
