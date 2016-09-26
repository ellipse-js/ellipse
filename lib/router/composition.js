/**
 * Inspired by `koa-compose`: https://github.com/koajs/compose
 */

'use strict'

// expose

module.exports = Composition

// include

var wrap = require('co').wrap

// constructor

function Composition(middleware) {
    if (middleware instanceof Function)
        middleware = [ middleware ]

    this.middleware = middleware || []
}

// instance method

Composition.prototype.handle = wrap(function *(ctx, req, res, next, value) {
    var mw    = this.middleware,
        i     = mw.length,
        error = next

    next = done(next)

    while (i--)
        next = mw[ i ](ctx, req, res, next, value)

    try {
        yield *next
    }
    catch (ex) {
        error(ex)
    }
})

// methods

function *done(next) {
    yield next()
}
