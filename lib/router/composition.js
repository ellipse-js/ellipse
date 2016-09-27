/**
 * Inspired by `koa-compose`: https://github.com/koajs/compose
 */

'use strict'

// expose

module.exports = Composition

// include

const wrap = require('co').wrap

// constructor

function Composition(middleware) {
    if (middleware instanceof Function)
        middleware = [ middleware ]

    this.middleware = middleware || []
}

// composition helper

Composition.prototype.handle = wrap(function *handle(ctx, req, res, next, value) {
    const mw    = this.middleware,
          error = next

    var i = mw.length

    next = done(next)

    while (i--)
        next = mw[ i ].call(ctx, next, value)

    try {
        yield *next
    }
    catch (ex) {
        error(ex)
    }
})

// methods

function *done(next) {
    const p = next()

    if (p)
        yield p
}
