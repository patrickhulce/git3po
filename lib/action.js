const _ = require('lodash')
const preprocess = require('./filter').preprocess

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
      MERGE: 'merge',
    }
  }

  static from(action) {
    return new Action(action)
  }

  toLog() {
    return _.startCase(this._action.type).toLowerCase()
  }

  apply(issue, github) {
    let action = {...this._action}
    switch (this._action.type) {
      case Action.TYPES.ADD_COMMENT:
        return github.addComment(issue, action.body)
      case Action.TYPES.ADD_LABEL:
        return github.addLabel(issue, action.label)
      case Action.TYPES.REMOVE_LABEL:
        return github.removeLabel(issue, action.label)
      case Action.TYPES.CLOSE:
        return github.closeIssue(issue)
      case Action.TYPES.LOCK:
        return github.lockobject(issue, action.reason)
      case Action.TYPES.MERGE:
        // For now, only preprocess this action. Doing the same for the others is probably fine,
        // but hasn't been tested.
        // By default, use the PR's title as the commit title.
        if (!action.title) {
          action.title = '%%title%%'
        }
        action = preprocess(action, issue)
        return github.mergePullRequest(issue, action.mergeMethod, action.title, action.message)
      default:
        throw new TypeError(`Unknown action type: ${action.type}`)
    }
  }
}

module.exports = Action
