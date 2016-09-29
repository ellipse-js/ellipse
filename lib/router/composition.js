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
    if (typeof middleware === 'function')
        middleware = [ middleware ]

    this.middleware = middleware || []
}

// composition helper

Composition.prototype.handle = wrap(function *handle(ctx, req, res, next, value) {
    const middleware = this.middleware,
          error      = next

    var i = middleware.length

    next = done(next)

    while (i--)
        next = middleware[ i ].call(ctx, next, value)

    try {
        yield *next
    }
    catch (ex) {
        error(ex)
    }
})

// methods

function *done(next) {
    next = next()

    if (next)
        yield next
}
