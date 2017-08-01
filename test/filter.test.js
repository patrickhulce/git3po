const expect = require('chai').expect
const Filter = require('../lib/filter')

describe('filter.js', () => {
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
