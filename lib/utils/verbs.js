'use strict'

// expose

module.exports = defineVerbs

// includes

const methods = require('methods')

// methods

function lowerCase(string) {
    return string.toLowerCase()
}

function defineVerbs(base, fn) {
    methods.map(lowerCase).forEach(function (method) {
        Object.defineProperty(base.prototype, method, { value: fn(method) })
    })
}
