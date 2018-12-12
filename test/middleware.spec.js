// @ts-check
var assert = require('assert')
var mockFs = require('mock-fs')
var sinon = require('sinon')

var request = require('./lib/request')
var matchPath = require('./lib/match-local-path')

var openInEditor = require('..')
var util = require('../lib/util')

describe('open-in-editor-connect', function () {
  beforeEach(function () {
    this.sandbox = sinon.createSandbox()
    this.mockFs = function (options) {
      mockFs(options)
    }
    this.fakeOpenSuccess = function () {
      return this.sandbox.stub(util, 'open').callsFake(() => Promise.resolve(''))
    }
    this.fakeOpenError = function () {
      return this.sandbox.stub(util, 'open').callsFake(() => Promise.reject(new Error('xx')))
    }
  })

  afterEach(function () {
    mockFs.restore()
    this.sandbox.restore()
  })

  it('should require root path', function () {
    assert.throws(openInEditor.bind(null), /root path required/)
  })

  it('should require root path to be string', function () {
    assert.throws(openInEditor.bind(null, 42), /root path.*string/)
  })

  it('should open in editor on selected line', function () {
    var open = this.fakeOpenSuccess()
    var middleware = openInEditor('/')
    this.mockFs({ '/index.js': 'hello' })

    return request(middleware).post('/index.js:1')
      .expect(200, '{"status":"ok"}')
      .expect('Content-Type', 'application/json')
      .expect(function () {
        sinon.assert.calledOnce(open)
        sinon.assert.calledWith(open, matchPath('/index.js:1'))
      })
  })

  it('should open in editor on selected line and column', function () {
    var open = this.fakeOpenSuccess()
    var middleware = openInEditor('/')
    this.mockFs({ '/index.js': 'hello' })

    return request(middleware).post('/index.js:1:1')
      .expect(200)
      .expect(function () {
        sinon.assert.calledOnce(open)
        sinon.assert.calledWith(open, matchPath('/index.js:1:1'))
      })
  })

  it('should skip urls without params', function () {
    var open = this.fakeOpenSuccess()
    var middleware = openInEditor('/')
    this.mockFs({ '/xx': '' })

    return request(middleware).post('/index.js')
      .expect(404, 'next()')
      .expect(function () {
        sinon.assert.notCalled(open)
      })
  })

  it('should skip if file not found', function () {
    var open = this.fakeOpenSuccess()
    var middleware = openInEditor('/')
    this.mockFs({ '/xx': '' })

    return request(middleware).post('/index.js')
      .expect(404, 'next()')
      .expect(function () {
        sinon.assert.notCalled(open)
      })
  })

  it('should display open error', function () {
    var open = this.fakeOpenError()
    var middleware = openInEditor('/')
    this.mockFs({ '/index.js': 'hello' })

    return request(middleware).post('/index.js:1')
      .expect(500, '{"status":"error","message":"Error: xx"}')
      .expect('Content-Type', 'application/json')
      .expect(function () {
        sinon.assert.calledOnce(open)
        sinon.assert.calledWith(open, matchPath('/index.js:1'))
      })
  })

  it('should use rootPath', function () {
    var open = this.fakeOpenSuccess()
    var middleware = openInEditor('/root')
    this.mockFs({ '/root/index.js': 'hello' })

    return request(middleware).post('/index.js:1')
      .expect(200)
      .expect(function () {
        sinon.assert.calledOnce(open)
        sinon.assert.calledWith(open, matchPath('/root/index.js:1'))
      })
  })

  it('should has option "editor"', function () {
    var open = this.fakeOpenSuccess()
    var middleware = openInEditor('/', { editor: { name: 'vim' } })
    this.mockFs({ '/index.js': 'hello' })

    return request(middleware).post('/index.js:1')
      .expect(200)
      .expect(function () {
        sinon.assert.calledOnce(open)
        sinon.assert.calledWith(open, matchPath('/index.js:1'), { editor: 'vim' })
      })
  })

  describe('url params', function () {
    it('should select editor with query param', function () {
      var open = this.fakeOpenSuccess()
      var middleware = openInEditor('/', { editor: { name: 'vim', binary: '/usr/bin/vim' } })
      this.mockFs({ '/index.js': 'hello' })

      return request(middleware).post('/index.js?edit=emacs')
        .expect(200)
        .expect(function () {
          sinon.assert.calledOnce(open)
          sinon.assert.calledWith(open, matchPath('/index.js'), { editor: 'emacs' })
        })
    })

    it('should select default editor with empty query param', function () {
      var open = this.fakeOpenSuccess()
      var middleware = openInEditor('/', { editor: { name: 'vim' } })
      this.mockFs({ '/index.js': 'hello' })

      return request(middleware).post('/index.js?edit')
        .expect(200)
        .expect(function () {
          sinon.assert.calledOnce(open)
          sinon.assert.calledWith(open, matchPath('/index.js'), { editor: 'vim' })
        })
    })

    it('should ignore other query arguments', function () {
      var open = this.fakeOpenSuccess()
      var middleware = openInEditor('/')
      this.mockFs({ '/index.js': 'hello' })

      return request(middleware).post('/index.js:1?a=1&b=&c')
        .expect(200)
        .expect(function () {
          sinon.assert.calledOnce(open)
          sinon.assert.calledWith(open, matchPath('/index.js:1'))
        })
    })
  })

  describe('UI', function () {
    it('should respond with HTML', function () {
      var open = this.fakeOpenSuccess()
      var middleware = openInEditor('/')
      this.mockFs({ '/index.js': 'hello' })

      return request(middleware).get('/index.js:1')
        .expect(200)
        .expect('Content-Type', 'text/html')
        .expect(function () {
          sinon.assert.notCalled(open)
        })
    })
  })
})
