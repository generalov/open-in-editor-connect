// @ts-check

/**
 * Unix/Windows path match.
 *
 * @return {RegExp}
 */
module.exports = function createAbsolutePathRegExp (path) {
  return new RegExp('^([a-zA-Z]:)?' + path.replace(/\//g, '[/\\\\]'));
};
