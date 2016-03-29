/**
 * Created by schwarzkopfb on 16/3/29.
 */

// todo: copyright stuff: `koa-compose`

'use strict'

function *noop() {}

function compose(middleware) {
    return function *(ctx, req, res, done) {
        var next = noop()

        var i = middleware.length

        while (i--)
            // todo: wrap middleware
            next = middleware[i].call(ctx, ctx, req, res, next)

        yield *next
        done()
    }
}

module.exports = compose
