// @ts-check

var serveStatic = require('serve-static');

function sendSourceLocationHeader (res, filePath) {
  res.setHeader('X-SourcePath', filePath);
}

function serveStaticAdapter (openInEditor, settings) {
  return function (rootPath, options) {
    var opts = (options || {});

    opts.setHeaders = (function (fn) {
      return function (res, filePath) {
        sendSourceLocationHeader(res, filePath);
        fn && fn(res, filePath);
      };
    }(opts.setHeaders));

    var serveStaticMiddleware = serveStatic(rootPath, opts);
    var openInEditorMiddleware = openInEditor(rootPath, settings);

    return function (req, res, next) {
      openInEditorMiddleware(req, res, function () {
        serveStaticMiddleware(req, res, next);
      });
    };
  };
}

module.exports = serveStaticAdapter;
