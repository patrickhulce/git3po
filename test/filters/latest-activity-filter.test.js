/* eslint-disable camelcase */
const expect = require('chai').expect
const LatestActivityFilter = require('../../lib/filters/latest-activity-filter')

describe('filters/latest-activity-filter.js', () => {
  let comments = []
  let commits = []
  let user = {}
  const githubApi = {
    fetchComments: () => Promise.resolve(comments),
    fetchCommits: () => Promise.resolve(commits),
  }

  function comment(opts = {}) {
    return Object.assign({
      body: '',
      created_at: '2017-10-01',
      user,
    }, opts)
  }

  function commit(opts = {}) {
    return Object.assign({
      commit: {
        message: opts.message || '',
        committer: {date: opts.created_at || '2017-10-01'},
      },
      author: user,
      committer: user,
    }, opts)
  }

  beforeEach(() => {
    comments = []
    commits = []
    user = {login: 'patrickhulce'}
  })

  describe('.apply', () => {
    it('should reject issues with no activity by default', async () => {
      const filter = new LatestActivityFilter({})
      comments = []
      expect(await filter.apply({user}, githubApi)).to.equal(false)
    })

    it('should accept PRs with some activity by default', async () => {
      const filter = new LatestActivityFilter({})
      comments = [comment()]
      expect(await filter.apply({user}, githubApi)).to.equal(true, 'first')

      comments = []
      commits = [commit()]
      expect(await filter.apply({user}, githubApi)).to.equal(true, 'second')
    })

    it('should filter out items not matching filter', async () => {
      const filter = new LatestActivityFilter({filter: {text: 'only this'}})
      comments = [comment({body: 'ignore'})]
      expect(await filter.apply({user}, githubApi)).to.equal(false)

      comments = [comment({body: 'only this'})]
      expect(await filter.apply({user}, githubApi)).to.equal(true)
    })

    it('should accept PRs with matching latest activity criteria', async () => {
      const filter = new LatestActivityFilter({criteria: {type: 'commit'}})
      comments = [comment()]
      expect(await filter.apply({user}, githubApi)).to.equal(false)

      commits = [commit()]
      expect(await filter.apply({user}, githubApi)).to.equal(false)

      commits = [commit({created_at: '2017-11-01'})]
      expect(await filter.apply({user}, githubApi)).to.equal(true)
    })

    it('should accept %%author%% matches', async () => {
      const filter = new LatestActivityFilter({criteria: {author: {$neq: '%%author%%'}}})
      comments = [
        comment({user: {login: 'reviewer'}, created_at: '2017-10-01'}),
        comment({user: {login: 'committer'}, created_at: '2017-10-02'}),
        comment({user: {login: 'committer'}, created_at: '2017-10-03'}),
      ]
      expect(await filter.apply({user: {login: 'committer'}}, githubApi)).to.equal(false)

      comments = [
        comment({user: {login: 'reviewer'}, created_at: '2017-10-01'}),
        comment({user: {login: 'committer'}, created_at: '2017-10-02'}),
        comment({user: {login: 'committer'}, created_at: '2017-10-03'}),
        comment({user: {login: 'reviewer'}, created_at: '2017-10-04'}),
      ]
      expect(await filter.apply({user: {login: 'committer'}}, githubApi)).to.equal(true)
    })
  })
})
