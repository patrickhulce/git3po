/* eslint-disable camelcase */

const expect = require('chai').expect
const chrono = require('chrono-node')
const IssueFilter = require('../../lib/filters/issue-filter')

describe('filters/issue-filter.js', () => {
  describe('.apply', () => {
    it('should throw when criteria is not defined', () => {
      const filter = new IssueFilter({})
      expect(() => filter.apply()).to.throw(/criteria/)
    })

    it('should work simple criteria', () => {
      const criteria = {state: 'open'}
      const filter = new IssueFilter({criteria})
      expect(filter.apply({state: 'open'})).to.equal(true)
      expect(filter.apply({state: 'closed'})).to.equal(false)
    })

    it('should work complex criteria', () => {
      const criteria = {
        $not: {state: 'closed'},
        labels: {$includes: 'my_label'},
      }

      const filter = new IssueFilter({criteria})
      expect(filter.apply({
        state: 'open',
        labels: [{name: 'my_label'}],
      })).to.equal(true)
      expect(filter.apply({
        state: 'closed',
        labels: [{name: 'my_label'}],
      })).to.equal(false)
      expect(filter.apply({
        state: 'open',
        labels: [{name: 'other'}],
      })).to.equal(false)
    })

    it('should should preprocess date()', () => {
      const criteria = {
        updatedAt: {$lt: '%%date(1 month ago)%%'},
      }

      const filter = new IssueFilter({criteria})
      expect(filter.apply({
        updated_at: chrono.parseDate('2 months ago'),
      })).to.equal(true)
      expect(filter.apply({
        updated_at: chrono.parseDate('2 days ago'),
      })).to.equal(false)
    })
  })
})
