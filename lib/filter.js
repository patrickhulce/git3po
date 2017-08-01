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

  static from(filter) {
    const Class = Filter.CLASSES[filter.type]
    if (!Class) {
      throw new TypeError(`Unknown filter type: ${filter.type}`)
    }

    return new Class(filter)
  }

  _apply() {
    throw new Error('Unimplemented')
  }

  apply(issue) {
    const applies = this._apply(issue)
    return this._filter.negate ? !applies : applies
  }
}

module.exports = Filter
Filter.CLASSES = require('./filters')
