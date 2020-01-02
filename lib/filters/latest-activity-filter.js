const _ = require('lodash')
const GitHub = require('../github')
const Filter = require('../filter')

class LatestActivityFilter extends Filter {
  get type() {
    return Filter.TYPES.LATEST_ACTIVITY
  }

  async _apply(issue, github) {
    let activities = await Promise.all([
      github.fetchComments(issue),
      github.fetchCommits(issue),
    ])

    activities = _.flatten(activities).map(GitHub.transformCommentOrCommit)
    if (this._filter.filter) {
      const filter = Filter.preprocess(this._filter.filter, issue)
      activities = activities.filter(Filter.createPredicate(filter))
    }

    const mostRecentActivity = _.maxBy(activities, activity => activity.createdAt.getTime())
    const criteria = Filter.preprocess(this._filter.criteria, issue)
    const predicate = Filter.createPredicate(criteria)
    return predicate(mostRecentActivity)
  }
}

module.exports = LatestActivityFilter
