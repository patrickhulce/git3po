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

    const criteria = Filter.preprocess(this._filter.criteria, issue)
    const predicate = Filter.createPredicate(criteria)
    return predicate(GitHub.transformIssue(issue))
  }
}

module.exports = IssueFilter
