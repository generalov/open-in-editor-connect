
var openInEditor = require('@generalov/open-in-editor')

function open (path, opts) {
  var opener = openInEditor.configure(opts)

  return opener.open(path)
}

module.exports = {
  open: open
}
