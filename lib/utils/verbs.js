/**
 * Created by schwarzkopfb on 16/3/26.
 */

'use strict'

// expose

module.exports = defineVerbs

// includes

var methods = require('methods')

// methods

function lowerCase(string) {
    return string.toLowerCase()
}

function defineVerbs(base, fn) {
    methods.map(lowerCase).forEach(function (method) {
        Object.defineProperty(base.prototype, method, { value: fn(method) })
    })
}
