const _ = require('lodash')
const chrono = require('chrono-node')

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
      $and: matchValue => {
        const predicates = matchValue.map(Filter.createPredicate)
        return value => predicates.every(predicate => predicate(value))
      },
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

  static preprocess(object, issue) {
    // Default to a filter that will always pass.
    if (typeof object === 'undefined') {
      object = {text: ''}
    }

    const replacements = {
      author: issue.user && issue.user.login,
      date: relativeTimePhrase => chrono.parseDate(relativeTimePhrase),
    }

    _.forEach(replacements, (value, name) => {
      if (typeof value === 'function') {
        Filter.replacePropertyDynamic(object, new RegExp(`%%${name}\\((.*?)\\)%%`), value)
      } else {
        Filter.replaceProperty(object, `%%${name}%%`, value)
      }
    })

    return object
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

  static replacePropertyDynamic(object, needleRegex, replacementFn) {
    if (typeof object === 'object') {
      _.forEach(object, (value, key) => {
        object[key] = Filter.replacePropertyDynamic(value, needleRegex, replacementFn)
      })
      return object
    }

    const match = typeof object === 'string' && object.match(needleRegex)
    if (match) {
      return replacementFn(...match.splice(1))
    }

    return object
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
