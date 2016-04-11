/**
 * Created by schwarzkopfb on 15/11/20.
 */

'use strict'

// expose

exports = module.exports = handleError
exports.internal = error

// includes

var statusCodes   = require('http').STATUS_CODES,
    listenerCount = require('../../utils/listenerCount')

// methods

function getErrorMessage(err) {
    var code = +(err.status || err.statusCode || err.statusMessage) || 500

    if(code >= 400 && code < 500 && err.message && err.expose)
        return err.message
    else
        return statusCodes[ code ]
}

function handleError(err, ctx, req, res) {
    var router = ctx.router,
        status = ctx.status,
        stack  = (err.stack || err).toString(),
        env    = ctx.app.env

    // there is a parent router that probably has a custom error handler
    // so delegate error to the parent
    if (router.parent) {
        req.router = res.router = router.parent

        return error(err, ctx, req, res)
    }

    if (err.status || err.statusCode)
        ctx.status = err.status
    else if (!status || (status >= 200 && status < 300))
        ctx.status = 500

    // we only need to print an error if it's `>=500`,
    // since lower status codes are indicating errors
    // related to the client (requester)
    var printable = ctx.status >= 500 && stack

    if(!res.finished) {
        ctx.text =
        ctx.message = getErrorMessage(err)

        if (env === 'development' && printable)
            ctx.text += '\n\n' + stack

        ctx.send()
    }

    if (env !== 'test' && printable)
        console.error(stack)
}

function error(err, ctx, req, res) {
    if(!(err instanceof Error))
        err = new Error(err)

    var router    = ctx.router,
        listeners = listenerCount(router, 'error')

    if(listeners)
        router.emit('error', err, ctx, req, res)
    else
        handleError(err, ctx, req, res)
}
