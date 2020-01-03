const _ = require('lodash')

class Action {
  constructor(action) {
    this._action = action
  }

  static get TYPES() {
    return {
      ADD_COMMENT: 'add_comment',
      ADD_LABEL: 'add_label',
      REMOVE_LABEL: 'remove_label',
      CLOSE: 'close',
      LOCK: 'lock',
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
      case Action.TYPES.REMOVE_LABEL:
        return github.removeLabel(issue, this._action.label)
      case Action.TYPES.CLOSE:
        return github.closeIssue(issue)
      case Action.TYPES.LOCK:
        return github.lockIssue(issue, this._action.label)
      default:
        throw new TypeError(`Unknown action type: ${this._action.type}`)
    }
  }
}

module.exports = Action
