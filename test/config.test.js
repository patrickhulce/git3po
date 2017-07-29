const path = require('path')
const expect = require('chai').expect
const Config = require('../lib/config')

const fixture = filePath => path.join(__dirname, `fixtures/${filePath}`)

describe('config.js', () => {
  describe('#from', () => {
    it('should load a yaml config', () => {
      const config = Config.from(fixture('config.yaml'))
      expect(config.repo).to.equal('patrickhulce/git3po')
      expect(config.startAt).to.eql(new Date('2017-01-14'))
    })
  })
})
