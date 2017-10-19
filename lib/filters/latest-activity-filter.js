const _ = require('lodash')
const GitHub = require('../github')
const Filter = require('../filter')

class LatestActivityFilter extends Filter {
  get type() {
    return Filter.TYPES.LATEST_ACTIVITY
  }

  static replaceAll(object, issue) {
    if (typeof object === 'undefined') {
      object = {text: ''}
    }

    const replacements = {
      author: issue.user.login,
    }

    _.forEach(replacements, (value, name) => {
      Filter.replaceProperty(object, `%%${name}%%`, value)
    })

    return object
  }

  async _apply(issue, github) {
    let activities = await Promise.all([
      github.fetchComments(issue),
      github.fetchCommits(issue),
    ])

    activities = _.flatten(activities).map(GitHub.transformCommentOrCommit)
    if (this._filter.filter) {
      const filter = LatestActivityFilter.replaceAll(this._filter.filter, issue)
      activities = activities.filter(Filter.createPredicate(filter))
    }

    const mostRecentActivity = _.maxBy(activities, activity => activity.createdAt.getTime())
    const criteria = LatestActivityFilter.replaceAll(this._filter.criteria, issue)
    const predicate = Filter.createPredicate(criteria)
    return predicate(mostRecentActivity)
  }
}

module.exports = LatestActivityFilter
