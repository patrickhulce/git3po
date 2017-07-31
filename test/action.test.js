const sinon = require('sinon')
const chai = require('chai')
const sinonChai = require('sinon-chai')
const Action = require('../lib/action')

chai.use(sinonChai)
const expect = chai.expect

describe('action.js', () => {
  let githubApi

  beforeEach(() => {
    const noop = () => Promise.resolve()
    githubApi = {
      addComment: noop,
      addLabel: noop,
      closeIssue: noop,
    }
  })

  describe('.apply', () => {
    it('should support add comment', () => {
      const addComment = sinon.stub(githubApi, 'addComment')

      const body = 'here is a comment'
      const issue = {number: 1234}
      const action = new Action({type: 'add_comment', body})
      action.apply(githubApi, issue)
      expect(addComment).to.have.been.calledWith(issue, body)
    })

    it('should support add label', () => {
      const addLabel = sinon.stub(githubApi, 'addLabel')

      const label = 'my-label'
      const issue = {number: 1234}
      const action = new Action({type: 'add_label', label})
      action.apply(githubApi, issue)
      expect(addLabel).to.have.been.calledWith(issue, label)
    })

    it('should support close', () => {
      const addLabel = sinon.stub(githubApi, 'closeIssue')
      const issue = {number: 1234}
      const action = new Action({type: 'close'})
      action.apply(githubApi, issue)
      expect(addLabel).to.have.been.calledWith(issue)
    })

    it('should throw on unrecognized type', () => {
      const issue = {number: 1234}
      const action = new Action({type: 'hello'})
      expect(() => action.apply(githubApi, issue)).to.throw()
    })
  })
})
