/**
 * Created by schwarzkopfb on 16/3/25.
 */

'use strict'

var assert  = require('assert'),
    Ellipse = require('../'),
    env     = process.env,
    app     = new Ellipse

function randStr() {
    var str = '',
        n   = 30

    for (;n--;)
        str += String.fromCharCode(Math.round(Math.random() * 25) + 97)

    return str
}

function isRequired(name) {
    return ~Object.keys(require.cache).join().indexOf(name)
}

/* app.proxy */

assert.equal(app.proxy, false, 'app.proxy should be false by default')
app.proxy = assert
assert.equal(app.proxy, assert, 'app.proxy should be updated by the user')

/* app.subdomainOffset */

assert.equal(app.subdomainOffset, 2, 'app.subdomainOffset should be 2 by default')

assert.doesNotThrow(function () {
    app.subdomainOffset = 1
}, 'app.subdomainOffset should be updated if a correct value provided')

assert.equal(app.subdomainOffset, 1, 'app.subdomainOffset should be updated by the user')

assert.throws(function () {
    app.subdomainOffset = -1
}, 'app.subdomainOffset should accept only positive integer numbers')

assert.throws(function () {
    app.subdomainOffset = 1.2
}, 'app.subdomainOffset should accept only positive integer numbers')

assert.throws(function () {
    app.subdomainOffset = 'test'
}, 'app.subdomainOffset should accept only positive integer numbers')

assert.equal(app.subdomainOffset, 1, 'app.subdomainOffset should be unchanged')

/* app.log */

assert.equal(app.log, 'development', "app.log should default to 'development'")

assert(!isRequired('ellipse-logger'), '`ellipse-logger` should not be required before needed')

assert.doesNotThrow(function () {
    app.log = true
}, '`true` is a valid value for app.log')

assert(isRequired('ellipse-logger'), '`ellipse-logger` should be required if needed')

assert.doesNotThrow(function () {
    app.log = false
}, '`false` is a valid value for app.log')

assert.doesNotThrow(function () {
    app.log = randStr
}, 'any function is a valid value for app.log')

assert.doesNotThrow(function () {
    app.log = 'test'
}, 'any string is a valid value for app.log')

assert.throws(function () {
    app.log = {}
}, 'app.log must not be an object')

assert.equal(app.log, 'test', 'app.log should should be unchanged')

/* app.env */

delete env.NODE_ENV

app = new Ellipse

assert.equal(app.env, 'development', "app.env should be 'development' if NODE_ENV is empty")

for(var i = 5; i--;) {
    env.NODE_ENV = randStr()
    app          = new Ellipse
    assert.equal(app.env, env.NODE_ENV, 'app.env should equal to NODE_ENV if specified')
}

assert.throws(function () {
    app.env = 1
}, 'app.env must not be a number')

assert.throws(function () {
    app.env = true
}, 'app.env must not be a bool')

assert.throws(function () {
    app.env = {}
}, 'app.env must not be an object')

assert.throws(function () {
    app.env = randStr
}, 'app.env must not be a function')

assert.doesNotThrow(function () {
    app.env = randStr()
}, 'app.env must be string')
