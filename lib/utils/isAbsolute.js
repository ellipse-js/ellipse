'use strict'

module.exports = isAbsolute

const isAbsolutePath = require('path').isAbsolute

/**
 * Returns `true` if given path is absolute.
 *
 * @param {string} path Path to check
 * @returns {boolean}
 */
function isAbsolute(path) {
    // note: Microsoft Azure absolute paths are starting with '\\'
    return (isAbsolutePath(path) || path.substring(0, 2) === '\\\\')
}
