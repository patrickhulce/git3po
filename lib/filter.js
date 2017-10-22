const _ = require('lodash')

class Filter {
  constructor(filter) {
    this._filter = filter
  }

  static get TYPES() {
    return {
      TEXT: 'text',
      LABEL: 'label',
      STATE: 'state',
      ISSUE: 'issue',
      COMMENTS: 'comments',
      LATEST_ACTIVITY: 'latest_activity',
    }
  }

  static get CONDITIONS() {
    return {
      $eq: matchValue => value => value === matchValue,
      $neq: matchValue => value => value !== matchValue,
      $match: matchValue => value => typeof value === 'string' && value.includes(matchValue),
      $nmatch: matchValue => value => typeof value !== 'string' || !value.includes(matchValue),
      $gt: matchValue => value => value > matchValue,
      $lt: matchValue => value => value < matchValue,
      $in: matchValue => value => matchValue.includes(value),
      $nin: matchValue => value => !matchValue.includes(value),
      $includes: matchValue => value => value.includes(matchValue),
      $or: matchValue => {
        const predicates = matchValue.map(Filter.createPredicate)
        return value => predicates.some(predicate => predicate(value))
      },
      $not: matchValue => {
        const predicate = Filter.createPredicate(matchValue)
        return value => !predicate(value)
      },
    }
  }

  static from(filter) {
    const Class = Filter.CLASSES[filter.type]
    if (!Class) {
      throw new TypeError(`Unknown filter type: ${filter.type}`)
    }

    return new Class(filter)
  }

  static createPredicate(definition) {
    if (typeof definition === 'string') {
      return Filter.createPredicate({$match: definition})
    } else if (typeof definition !== 'object') {
      return Filter.createPredicate({$eq: definition})
    }

    const conditions = Object.keys(definition).map(key => {
      if (Filter.CONDITIONS[key]) {
        return Filter.CONDITIONS[key](definition[key])
      }

      const childPredicate = Filter.createPredicate(definition[key])
      return value => childPredicate(_.get(value, key))
    })

    return value => conditions.every(condition => condition(value))
  }

  static replaceProperty(object, needle, replacement) {
    if (object === needle) {
      return replacement
    } else if (typeof object === 'object') {
      _.forEach(object, (value, key) => {
        object[key] = Filter.replaceProperty(value, needle, replacement)
      })
      return object
    } else {
      return object
    }
  }

  toLog() {
    return this._filter.type
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
