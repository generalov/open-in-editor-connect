var sinon = require('sinon');
var createAbsolutePathRegExp = require('./create-absolute-path-regexp');

module.exports = function matchLocalPath (expectedPath) {
  return sinon.match(function (value) {
    return createAbsolutePathRegExp(expectedPath).test(value);
  }, expectedPath + ' does not matched');
};
