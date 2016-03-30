/**
 * Created by schwarzkopfb on 16/3/30.
 */

'use strict'

// vars

var logger, compose, wrapGenerator

// methods & exposition

module.exports = {
    get logger() {
        return logger || (logger = require('ellipse-logger'))
    },

    get compose() {
        return compose || (compose = require('./compose'))
    },

    get wrapGenerator() {
        return wrapGenerator || (wrapGenerator = require('./wrap/generator'))
    }
}
