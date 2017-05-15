var fs = require('fs');
var url = require('url');
var resolveFile = require('./resolve');
var util = require('./util');

var defaultOptions = {
  dotfiles: 'ignore',
  editorParam: 'edit',
  serveStatic: false
};

function getEditorOptions (config) {
  var editorOptions = {};
  var opts = (config || {});

  if (opts.name != null) {
    editorOptions.editor = String(opts.name);
  }
  if (opts.binary != null) {
    editorOptions.cmd = String(opts.binary);
  }
  if (opts.args != null) {
    editorOptions.pattern = String(opts.args);
  }
  if (opts.terminal != null) {
    editorOptions.terminal = Boolean(opts.terminal);
  }

  return editorOptions;
}

function getQueryOptions (urlParts, options) {
  var queryOptions = null;

  if (urlParts.query && urlParts.query[options.editorParam]) {
    queryOptions = {
      editor: urlParts.query[options.editorParam]
    };
  }

  return queryOptions;
}

function getFileName (path) {
  var ms = path.match(/^(.*?)(:[0-9]+)?(:[0-9]+)?$/);

  return ms && ms[1];
}

function openInEditorMiddlewareFactory (rootPath, options) {
  if (!rootPath) {
    throw new Error('root path required');
  }
  if (typeof rootPath !== 'string') {
    throw new Error('root path should be a string');
  }

  var editorOptions = getEditorOptions(options.editor);

  var self = function openInEditorMiddleware (req, res, next) {
    var urlParts = url.parse(req.url, true);

    if (!urlParts.pathname.match(/:\d+$/) && !(urlParts.query && options.editorParam in urlParts.query)) {
      next();
      return;
    }

    var filePath = resolveFile(urlParts.pathname, { root: rootPath, dotfiles: options.dotfiles });
    var fileName = getFileName(filePath);
    fs.access(fileName, function (err) {
      if (err) {
        next();
        return;
      }

      var params = getQueryOptions(urlParts, options) || editorOptions;
      util.open(filePath, params)
      .then(function () {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
          status: 'ok'
        }));
      })
      .catch(function (err) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({
          status: 'error',
          message: String(err)
        }));
      });
    });
  };

  return self;
}

function openInEditorMiddlewareFactoryFactory (rootPath, settings) {
  if (typeof rootPath === 'object') {
    settings = rootPath;
    rootPath = undefined;
  }

  var opts = Object.assign({}, defaultOptions, settings);

  if (opts.serveStatic) {
    return require('./serve-static-adapter')(openInEditorMiddlewareFactory, opts);
  } else if (!rootPath && typeof settings === 'object') {
    return function (rootPath, options) {
      return openInEditorMiddlewareFactoryFactory(rootPath, Object.assign({}, opts, options));
    };
  } else {
    return openInEditorMiddlewareFactory(rootPath, opts);
  }
}

module.exports = openInEditorMiddlewareFactoryFactory;
