'use strict'

// vars

var Composition, wrapGenerator

// methods & exposition

module.exports = {
    get Composition() {
        return Composition || (Composition = require('../router/composition'))
    },

    get wrapGenerator() {
        return wrapGenerator || (wrapGenerator = require('./wrap/generator'))
    }
}
