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

  static get CONDITIONS() {
    return {
      $eq: matchValue => value => value === matchValue,
      $neq: matchValue => value => value !== matchValue,
      $match: matchValue => value => value && value.includes(matchValue),
      $gt: matchValue => value => value > matchValue,
      $lt: matchValue => value => value < matchValue,
      $in: matchValue => value => matchValue.includes(value),
      $nin: matchValue => value => !matchValue.includes(value),
    }
  }

  static from(filter) {
    const Class = Filter.CLASSES[filter.type]
    if (!Class) {
      throw new TypeError(`Unknown filter type: ${filter.type}`)
    }

    return new Class(filter)
  }

  static createPredicate(specifier) {
    if (typeof specifier === 'string') {
      return Filter.createPredicate({$match: specifier})
    } else if (typeof specifier !== 'object') {
      return Filter.createPredicate({$eq: specifier})
    }

    const conditions = Object.keys(specifier)
      .filter(key => Filter.CONDITIONS[key])
      .map(key => Filter.CONDITIONS[key](specifier[key]))
    return value => conditions.every(condition => condition(value))
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
