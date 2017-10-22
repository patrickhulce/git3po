const Filter = require('../filter')
const GitHub = require('../github')

class IssueFilter extends Filter {
  get type() {
    return Filter.TYPES.ISSUE
  }

  _apply(issue) {
    if (!this._filter.criteria) {
      throw new Error('issue filter must define criteria')
    }

    const predicate = Filter.createPredicate(this._filter.criteria)
    return predicate(GitHub.transformIssue(issue))
  }
}

module.exports = IssueFilter
