/**
 * Created by schwarzkopfb on 15/11/20.
 */

'use strict'

/**
 * Check the given path is absolute or not
 * Ported from Express (https://github.com/strongloop/express)
 *
 * @param path {string} The path to check
 * @returns {boolean} Returns true if path is absolute.
 */
function isAbsolute(path) {
    if ('/' == path[0]) return true
    if (':' == path[1] && '\\' == path[2]) return true
    if ('\\\\' == path.substring(0, 2)) return true // Microsoft Azure absolute path
}

module.exports = isAbsolute
