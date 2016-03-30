/**
 * Created by schwarzkopfb on 15/11/20.
 */

'use strict'

// expose

exports = module.exports = handleError
exports.internal = error

// include

var statusCodes = require('http').STATUS_CODES

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
        stack  = (err.stack || err).toString(),
        env    = ctx.app.env

    // there is a parent router that probably has a custom error handler
    // so delegate error to the parent
    if (router.parent) {
        req.router = res.router = router.parent

        return error(err, ctx, req, res)
    }

    if (err.status || err.statusCode)
        ctx.code = err.status
    else if (!ctx.code || (ctx.code >= 200 && ctx.code < 300))
        ctx.code = 500

    // we only need to print an error if it's `>=500`,
    // since lower status codes are indicating errors
    // related to the client (requester)
    var printable = ctx.code >= 500 && stack

    if (env === 'development' && printable)
        ctx.body += '\n\n' + stack

    if(!res.finished) {
        ctx.text =
        ctx.message = getErrorMessage(err)
        ctx.send()
    }

    if (env !== 'test' && printable)
        console.error(stack)
}

function error(err, ctx, req, res) {
    if(!(err instanceof Error))
        err = new Error(err)

    // save error to context. used to check state before upstream dispatching
    ctx._error = err

    var router    = ctx.router,
        listeners = router.listenerCount('error')

    if(listeners)
        router.emit('error', err, ctx, req, res)
    else
        handleError(err, ctx, req, res)
}
