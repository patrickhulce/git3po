const path = require('path')
const expect = require('chai').expect
const Config = require('../lib/config')

const fixture = filePath => path.join(__dirname, `fixtures/${filePath}`)

describe('config.js', () => {
  describe('#from', () => {
    it('should load a yaml config', () => {
      const config = Config.from(fixture('config.yaml'))
      expect(config.token).to.equal('secret')
      expect(config.repo).to.equal('patrickhulce/git3po')
      expect(config.startAt).to.eql(new Date('2017-01-14'))
      expect(config.filters).to.have.length(2)
      expect(config.actions).to.have.length(1)
    })

    it('should load a json config', () => {
      const config = Config.from(fixture('config.json'))
      expect(config.repo).to.equal('patrickhulce/git3po')
      expect(config.startAt).to.eql(new Date('2017-01-14'))
    })
  })

  describe('#url', () => {
    it('should load the url from the yaml config', () => {
      const config = Config.from(fixture('url-config.yaml'))
      expect(config.url).to.equal('https://github.privately.hosted.com')
    })
    it('should use the default url', () => {
      const config = Config.from(fixture('config.yaml'))
      expect(config.url).to.equal('https://api.github.com')
    })
  })
})
