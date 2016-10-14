/**
 * Inspired by `koa-compose`: https://github.com/koajs/compose
 */

'use strict'

module.exports = Composition

const wrap = require('co').wrap

function Composition(middleware) {
    if (typeof middleware === 'function')
        middleware = [ middleware ]

    this.middleware = middleware || []
}

Composition.prototype.handle = wrap(function *handle(ctx, req, res, next, value) {
    const middleware = this.middleware
    var i = middleware.length
    next = done(next)

    while (i--)
        next = middleware[ i ].call(ctx, next, value)

    yield *next
})

function *done(next) {
    yield next()
}
