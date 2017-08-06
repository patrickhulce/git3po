const expect = require('chai').expect
const CommentsFilter = require('../../dist/filters/comments-filter')

describe('filters/comments-filter.js', () => {
  let comments = []
  const githubApi = {fetchComments: () => Promise.resolve(comments)}

  beforeEach(() => {
    comments = []
  })

  describe('.apply', () => {
    it('should reject issues with no comments by default', async () => {
      const filter = new CommentsFilter({})
      comments = []
      expect(await filter.apply({}, githubApi)).to.equal(false)
      comments = [{body: 'body text'}]
      expect(await filter.apply({}, githubApi)).to.equal(true)
    })

    it('should accept issues with no comments', async () => {
      const filter = new CommentsFilter({length: 0})
      comments = []
      expect(await filter.apply({}, githubApi)).to.equal(true)
      comments = [{body: 'body text'}]
      expect(await filter.apply({}, githubApi)).to.equal(false)
    })

    it('should identify comment text', async () => {
      const filter = new CommentsFilter({text: 'foo'})

      comments = [
        {body: 'non-matching text'},
        {body: 'matching foo text'},
        {body: 'other non-matching text'},
      ]
      expect(await filter.apply({}, githubApi)).to.equal(true)

      comments = [
        {body: 'non-matching text'},
        {body: 'other non-matching text'},
      ]
      expect(await filter.apply({}, githubApi)).to.equal(false)
    })

    it('should accept issues with a particular author', async () => {
      const filter = new CommentsFilter({
        text: 'foo',
        author: {$in: ['patrickhulce']},
      })

      comments = [
        {body: 'non-matching text', user: {login: 'other'}},
        {body: 'matching foo text', user: {login: 'patrickhulce'}},
        {body: 'other non-matching text', user: {login: 'other'}},
      ]
      expect(await filter.apply({}, githubApi)).to.equal(true)

      comments = [
        {body: 'non-matching text', user: {login: 'other'}},
        {body: 'matching foo text', user: {login: 'other'}},
        {body: 'other non-matching text', user: {login: 'other'}},
      ]
      expect(await filter.apply({}, githubApi)).to.equal(false)
    })
  })
})
