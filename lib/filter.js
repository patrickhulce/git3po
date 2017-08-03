class Filter {
  constructor(filter) {
    this._filter = filter
  }

  static get TYPES() {
    return {
      TEXT: 'text',
      LABEL: 'label',
      STATE: 'state',
      COMMENTS: 'comments',
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

  apply(...args) {
    const applies = this._apply(...args)
    return this._filter.negate ? !applies : applies
  }
}

module.exports = Filter
Filter.CLASSES = require('./filters')
