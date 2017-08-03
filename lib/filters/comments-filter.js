const Filter = require('../filter')

class CommentsFilter extends Filter {
  get type() {
    return Filter.TYPES.COMMENTS
  }

  async _apply(issue, github) {
    const comments = await github.fetchComments(issue)
    return comments.length === 0
  }
}

module.exports = CommentsFilter
