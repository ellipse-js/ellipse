/**
 * Created by schwarzkopfb on 16/3/29.
 */

// todo: copyright stuff: `koa-compose`

'use strict'

// expose

module.exports = compose

// include

var co = require('co')

// methods

function compose(middleware) {
    return co.wrap(function *(ctx, req, res, next) {
        var i     = middleware.length,
            error = next

        next = done(next)

        while (i--)
            next = middleware[ i ](ctx, req, res, next)

        try {
            yield *next
        }
        catch (ex) {
            error(ex)
        }
    })
}

function *done(fn) {
    fn()
}
