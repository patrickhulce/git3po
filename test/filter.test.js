const expect = require('chai').expect
const Filter = require('../lib/filter')

describe('filter.js', () => {
  describe('#createPredicate', () => {
    it('should work with string values', () => {
      const predicate = Filter.createPredicate('foo')
      expect(predicate('other foo other')).to.equal(true)
      expect(predicate('bar')).to.equal(false)
    })

    it('should work with number values', () => {
      const predicate = Filter.createPredicate(10)
      expect(predicate(10)).to.equal(true)
      expect(predicate(5)).to.equal(false)
    })

    it('should work with $eq', () => {
      const predicate = Filter.createPredicate({$eq: 12})
      expect(predicate(12)).to.equal(true)
      expect(predicate(5)).to.equal(false)
      expect(predicate(undefined)).to.equal(false)
    })

    it('should work with $neq', () => {
      const predicate = Filter.createPredicate({$neq: 12})
      expect(predicate(5)).to.equal(true)
      expect(predicate(7)).to.equal(true)
      expect(predicate(12)).to.equal(false)
    })

    it('should work with $match', () => {
      let predicate = Filter.createPredicate({$match: 'foo'})
      expect(predicate('other foo other')).to.equal(true)
      expect(predicate('other')).to.equal(false)
      predicate = Filter.createPredicate({$match: ''})
      expect(predicate('')).to.equal(true)
    })

    it('should work with $nmatch', () => {
      let predicate = Filter.createPredicate({$nmatch: 'foo'})
      expect(predicate('other foo other')).to.equal(false)
      expect(predicate('other')).to.equal(true)
      predicate = Filter.createPredicate({$nmatch: ''})
      expect(predicate('')).to.equal(false)
    })

    it('should work with $gt', () => {
      const predicate = Filter.createPredicate({$gt: 5})
      expect(predicate(10)).to.equal(true)
      expect(predicate(5)).to.equal(false)
      expect(predicate(2)).to.equal(false)
    })

    it('should work with $lt', () => {
      const predicate = Filter.createPredicate({$lt: 5})
      expect(predicate(2)).to.equal(true)
      expect(predicate(5)).to.equal(false)
      expect(predicate(12)).to.equal(false)
    })

    it('should work with $in', () => {
      const predicate = Filter.createPredicate({$in: [1, 5, 7]})
      expect(predicate(1)).to.equal(true)
      expect(predicate(5)).to.equal(true)
      expect(predicate(7)).to.equal(true)
      expect(predicate(10)).to.equal(false)
    })

    it('should work with $nin', () => {
      const predicate = Filter.createPredicate({$nin: [1, 5, 7]})
      expect(predicate(1)).to.equal(false)
      expect(predicate(5)).to.equal(false)
      expect(predicate(7)).to.equal(false)
      expect(predicate(2)).to.equal(true)
      expect(predicate(10)).to.equal(true)
    })

    it('should work with $includes', () => {
      const predicate = Filter.createPredicate({$includes: 1})
      expect(predicate([1, 2, 3])).to.equal(true)
      expect(predicate([2, 4, 1])).to.equal(true)
      expect(predicate([2, 4])).to.equal(false)
      expect(predicate([])).to.equal(false)
    })

    it('should work with $and', () => {
      const predicate = Filter.createPredicate({
        $and: [
          {$gt: 5},
          {$lt: 10},
        ],
      })

      expect(predicate(6)).to.equal(true)
      expect(predicate(7)).to.equal(true)
      expect(predicate(1)).to.equal(false)
      expect(predicate(11)).to.equal(false)
      expect(predicate(10)).to.equal(false)
    })

    it('should work with $or', () => {
      const predicate = Filter.createPredicate({
        $or: [
          {$eq: 5},
          {$eq: 7},
        ],
      })

      expect(predicate(5)).to.equal(true)
      expect(predicate(7)).to.equal(true)
      expect(predicate(1)).to.equal(false)
      expect(predicate(2)).to.equal(false)
      expect(predicate(10)).to.equal(false)
    })

    it('should work with $not', () => {
      let predicate = Filter.createPredicate({$not: 1})
      expect(predicate(1)).to.equal(false)
      expect(predicate(2)).to.equal(true)
      expect(predicate('foo')).to.equal(true)
      predicate = Filter.createPredicate({$not: {$in: [1, 2]}})
      expect(predicate(1)).to.equal(false)
      expect(predicate(2)).to.equal(false)
      expect(predicate(3)).to.equal(true)
    })

    it('should work with multiple conditions', () => {
      const predicate = Filter.createPredicate({
        text: {$eq: 'foo'},
        other: {$match: 'bar'},
      })

      expect(predicate({text: 'foo', other: 'bar'})).to.equal(true)
      expect(predicate({text: 'foo', other: '1bar1'})).to.equal(true)
      expect(predicate({text: 'foo'})).to.equal(false)
      expect(predicate({other: 'bar'})).to.equal(false)
      expect(predicate({})).to.equal(false)
      expect(predicate(null)).to.equal(false)
      expect(predicate(1)).to.equal(false)
      expect(predicate('foo')).to.equal(false)
    })

    it('should work with multiple mixed conditions', () => {
      const predicate = Filter.createPredicate({
        $match: 'foo',
        length: {$gt: 7},
      })

      expect(predicate('foo')).to.equal(false)
      expect(predicate('bar foo baz')).to.equal(true)
    })
  })

  describe('.apply', () => {
    it('should support text filtering', () => {
      const filter = Filter.from({type: 'text', text: 'sample'})

      expect(filter.apply({
        title: 'Full sample title example',
        body: 'issue body',
      })).to.equal(true)

      expect(filter.apply({
        title: 'title',
        body: 'Sample issue body',
      })).to.equal(true)

      expect(filter.apply({
        title: 'Full title example',
        body: 'issue body',
      })).to.equal(false)
    })

    it('should support label filtering', () => {
      const filter = Filter.from({type: 'label', label: 'sample'})

      expect(filter.apply({
        labels: [
          {name: 'other'},
          {name: 'sample'},
        ],
      })).to.equal(true)

      expect(filter.apply({
        labels: [
          {name: 'sample-1'},
          {name: 'sample-2'},
        ],
      })).to.equal(false)
    })

    it('should support state filtering', () => {
      const filter = Filter.from({type: 'state', state: 'closed'})

      expect(filter.apply({state: 'closed'})).to.equal(true)
      expect(filter.apply({state: 'open'})).to.equal(false)
    })

    it('should support negation filtering', () => {
      const filter = Filter.from({type: 'label', label: 'sample', negate: true})

      expect(filter.apply({labels: []})).to.equal(true)
      expect(filter.apply({labels: [{name: 'sample'}]})).to.equal(false)
    })

    it('should throw on unrecognized type', () => {
      expect(() => Filter.from({type: 'hello'}).apply({})).to.throw()
    })
  })
})
