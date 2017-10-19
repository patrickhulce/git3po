const _ = require('lodash')
const Filter = require('../filter')

const SUPPORTED_FILTERS = ['text', 'author']
const FILTER_GETTERS = {
  text: 'body',
  author: 'user.login',
}

class CommentsFilter extends Filter {
  get type() {
    return Filter.TYPES.COMMENTS
  }

  static createCommentPredicate(filterDefinition) {
    const commentPredicates = _.intersection(
      Object.keys(filterDefinition),
      SUPPORTED_FILTERS
    ).map(name => {
      const valuePredicate = Filter.createPredicate(filterDefinition[name])
      const valueGetter = comment => _.get(comment, FILTER_GETTERS[name])
      return comment => valuePredicate(valueGetter(comment))
    })

    return comment => commentPredicates.every(predicate => predicate(comment))
  }

  async _apply(issue, github) {
    const comments = await github.fetchComments(issue)

    const commentPredicate = CommentsFilter.createCommentPredicate(this._filter)
    const filteredComments = comments.filter(commentPredicate)

    const lengthFilter =
      typeof this._filter.length === 'undefined'
        ? {$gt: 0}
        : this._filter.length
    const lengthPredicate = Filter.createPredicate(lengthFilter)
    return lengthPredicate(filteredComments.length)
  }
}

module.exports = CommentsFilter
