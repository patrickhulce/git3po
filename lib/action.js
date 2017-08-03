const _ = require('lodash')

class Action {
  constructor(action) {
    this._action = action
  }

  static get TYPES() {
    return {
      ADD_COMMENT: 'add_comment',
      ADD_LABEL: 'add_label',
      CLOSE: 'close',
    }
  }

  static from(action) {
    return new Action(action)
  }

  toLog() {
    return _.startCase(this._action.type).toLowerCase()
  }

  apply(issue, github) {
    switch (this._action.type) {
      case Action.TYPES.ADD_COMMENT:
        return github.addComment(issue, this._action.body)
      case Action.TYPES.ADD_LABEL:
        return github.addLabel(issue, this._action.label)
      case Action.TYPES.CLOSE:
        return github.closeIssue(issue)
      default:
        throw new TypeError(`Unknown filter type: ${this._action.type}`)
    }
  }
}

module.exports = Action
