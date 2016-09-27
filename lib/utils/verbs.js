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
    methods.map(lowerCase).forEach(m =>
        Object.defineProperty(base.prototype, m, { value: fn(m) }))
}
