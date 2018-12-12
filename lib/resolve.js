// @ts-check

var path = require('path')

function containsDotFile (pathParts) {
  return !!pathParts.filter(function (value) {
    return value[0] === '.'
  }).length
}

module.exports = function resolve (filePath, options) {
  var opts = options || {}
  var UP_PATH_REGEXP = /(?:^|[\\/])\.\.(?:[\\/]|$)/
  var absRoot = opts.root ? path.resolve(opts.root) : null
  var filename
  var pathParts

  try {
    filename = decodeURIComponent(filePath)
  } catch (err) {
    throw new Error('decode the path')
  }

  if (~filename.indexOf('\0')) {
    throw new Error('null byte(s)')
  }

  if (absRoot !== null) {
    if (UP_PATH_REGEXP.test(path.normalize('.' + path.sep + filename))) {
      throw new Error('malicious path')
    }
    filename = path.normalize(path.join(absRoot, filename))
    absRoot = path.normalize(absRoot + path.sep)
    pathParts = filename.substr(absRoot.length).split(path.sep)
  } else {
    if (UP_PATH_REGEXP.test(filename)) {
      throw new Error('".." is malicious without "root"')
    }
    pathParts = path.normalize(filename).split(path.sep)
    filename = path.resolve(filename)
  }

  if (containsDotFile(pathParts) && opts.dotfiles !== 'allow') {
    throw new Error('dotfile handling')
  }

  return filename
}
