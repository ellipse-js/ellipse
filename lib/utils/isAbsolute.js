'use strict'

module.exports = isAbsolute

const p = require('path')

/**
 * Returns `true` if given path is absolute.
 *
 * @param {string} path Path to check
 * @returns {boolean}
 */
function isAbsolute(path) {
    if (p.isAbsolute(path))
        return true
    // Microsoft Azure absolute path (ported from Express)
    else if (path.substring(0, 2) === '\\\\')
        return true

    return false
}
