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

  async _apply(issue, github) {
    const comments = await github.fetchComments(issue)

    const commentPredicates = _.intersection(
      Object.keys(this._filter),
      SUPPORTED_FILTERS
    ).map(name => {
      const valuePredicate = Filter.createPredicate(this._filter[name])
      const valueGetter = comment => _.get(comment, FILTER_GETTERS[name])
      return comment => valuePredicate(valueGetter(comment))
    })

    const commentPredicate = comment => commentPredicates
      .every(predicate => predicate(comment))
    const filteredComments = comments
      .filter(commentPredicate)

    const lengthFilter = typeof this._filter.length === 'undefined' ?
       {$gt: 0} : this._filter.length
    const lengthPredicate = Filter.createPredicate(lengthFilter)
    return lengthPredicate(filteredComments.length)
  }
}

module.exports = CommentsFilter
