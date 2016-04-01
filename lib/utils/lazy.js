/**
 * Created by schwarzkopfb on 16/3/30.
 */

'use strict'

// vars

var Logger, Composition, wrapGenerator

// methods & exposition

module.exports = {
    get Logger() {
        return Logger || (Logger = require('ellipse-logger'))
    },

    get Composition() {
        return Composition || (Composition = require('../router/composition'))
    },

    get wrapGenerator() {
        return wrapGenerator || (wrapGenerator = require('./wrap/generator'))
    }
}
