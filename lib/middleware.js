// @ts-check

const fs = require('fs')
const url = require('url')
const resolveFile = require('./resolve')
const util = require('./util')

const defaultOptions = {
  dotfiles: 'ignore',
  editorParam: 'edit',
  editorAtParam: 'at'
}

function getEditorOptions (config) {
  const editorOptions = {}
  const opts = (config || {})

  if (opts.name != null) {
    editorOptions.editor = String(opts.name)
  }
  if (opts.binary != null) {
    editorOptions.cmd = String(opts.binary)
  }
  if (opts.args != null) {
    editorOptions.pattern = String(opts.args)
  }
  if (opts.terminal != null) {
    editorOptions.terminal = Boolean(opts.terminal)
  }

  return editorOptions
}

function getQueryOptions (urlParts, options) {
  let editor

  if (urlParts.searchParams.has(options.editorParam)) {
    editor = urlParts.searchParams.get(options.editorParam)

    if (!editor && options.editor && options.editor.name) {
      editor = options.editor.name
    }
  }

  return editor ? { editor } : null
}

function getFileName (path) {
  const ms = path.match(/^(.*?)(:[0-9]+)?(:[0-9]+)?$/)

  return ms && ms[1]
}

function getRequestUrl (req) {
  const proto = req.connection.encrypted ? 'https' : 'http'

  return proto + '://' + req.headers['host'] + req.url
}

function openInEditorMiddlewareFactory (rootPath, options) {
  if (!rootPath) {
    throw new Error('root path required')
  }
  if (typeof rootPath !== 'string') {
    throw new Error('root path should be a string')
  }
  options = Object.assign({}, defaultOptions, options)

  const editorOptions = getEditorOptions(options.editor)

  return function openInEditorMiddleware (req, res, next) {
    const fullUrl = getRequestUrl(req)
    const urlParts = new url.URL(fullUrl)

    if (!urlParts.searchParams.has(options.editorParam) && !(
      urlParts.pathname.match(/:\d+$/) || urlParts.searchParams.has(options.editorAtParam))
    ) {
      next()
      return
    }

    const filePath = resolveFile(urlParts.pathname, {
      root: rootPath,
      dotfiles: options.dotfiles
    })

    const fileName = getFileName(filePath)

    fs.access(fileName, function (err) {
      if (err) {
        next()
        return
      }

      if (req.method === 'POST') {
        let pathToOpen = filePath
        const params = getQueryOptions(urlParts, options) || editorOptions

        if (urlParts.searchParams.has(options.editorAtParam)) {
          const at = String(urlParts.searchParams.get(options.editorAtParam))

          if (at.match(/^\d+(:\d+)?$/)) {
            pathToOpen += ':' + at
          }
        }

        util.open(pathToOpen, params)
          .then(function () {
            res.writeHead(200, {
              'Content-Type': 'application/json'
            })
            res.end(JSON.stringify({
              status: 'ok'
            }))
          })
          .catch(function (err) {
            res.writeHead(500, {
              'Content-Type': 'application/json'
            })
            res.end(JSON.stringify({
              status: 'error',
              message: String(err)
            }))
          })
      } else {
        const template = `<!DOCTYPE html>
<html>
<body onload="document.getElementById('form').submit()">
 <form id="form" method="post" action="">
  <button type="submit">Open</button>
 </form>
</body>
</html>`
        res.writeHead(200, {
          'Content-Type': 'text/html'
        })
        res.end(template)
      }
    })
  }
}

module.exports = openInEditorMiddlewareFactory
