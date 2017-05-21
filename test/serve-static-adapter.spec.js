// @ts-check
var mockFs = require('mock-fs');
var sinon = require('sinon');

var createAbsolutePathRegExp = require('./lib/create-absolute-path-regexp');
var request = require('./lib/request');
var matchLocalPath = require('./lib/match-local-path');

var openInEditor = require('..');
var util = require('../lib/util');

describe('serve-static-adapter', function () {
  beforeEach(function () {
    this.sandbox = sinon.sandbox.create();
    this.fakeOpenSuccess = function () {
      return this.sandbox.stub(util, 'open').callsFake(() => Promise.resolve(''));
    };
    this.mockFs = function (options) {
      mockFs(options);
    };
  });

  afterEach(function () {
    mockFs.restore();
    this.sandbox.restore();
  });

  it('should serve static', function () {
    var open = this.fakeOpenSuccess();
    var serveStatic = openInEditor({ serveStatic: true });
    this.mockFs({'/root/index.js': 'hello'});

    return request(serveStatic('/root')).get('/index.js')
      .expect(200, 'hello')
      .expect(function () {
        sinon.assert.notCalled(open);
      });
  });

  it('should open files', function () {
    var open = this.fakeOpenSuccess();
    var serveStatic = openInEditor({ serveStatic: true });
    this.mockFs({'/root/index.js': 'hello'});

    return request(serveStatic('/root')).post('/index.js:1')
      .expect(200, '{"status":"ok"}')
      .expect(function () {
        sinon.assert.calledOnce(open);
        sinon.assert.calledWith(open, matchLocalPath('/root/index.js:1'));
      });
  });

  it('should open files in configured editor', function () {
    var open = this.fakeOpenSuccess();
    var serveStatic = openInEditor({ serveStatic: true, editor: { name: 'vim' } });
    this.mockFs({'/root/index.js': 'hello'});

    return request(serveStatic('/root')).post('/index.js:1')
      .expect(200, '{"status":"ok"}')
      .expect(function () {
        sinon.assert.calledOnce(open);
        sinon.assert.calledWith(open, matchLocalPath('/root/index.js:1'), { editor: 'vim' });
      });
  });

  it('should open files with query', function () {
    var open = this.fakeOpenSuccess();
    var serveStatic = openInEditor({ serveStatic: true });
    this.mockFs({'/root/index.js': 'hello'});

    return request(serveStatic('/root')).post('/index.js?edit')
      .expect(200, '{"status":"ok"}')
      .expect(function () {
        sinon.assert.calledOnce(open);
        sinon.assert.calledWith(open, matchLocalPath('/root/index.js'));
      });
  });

  it('should serve static with X-SourcePath header', function () {
    var serveStatic = openInEditor({ serveStatic: true });
    this.mockFs({'/root/index.js': 'hello'});

    return request(serveStatic('/root')).get('/index.js')
      .expect(200)
      .expect('X-SourcePath', createAbsolutePathRegExp('/root/index.js'));
  });
});
