'use strict'

// expose

exports = module.exports = handleError
exports.internal = error

// includes

const statusCodes = require('http').STATUS_CODES

// methods

function getErrorMessage(err) {
    const code = +(err.status || err.statusCode) || 500

    if (code >= 400 && code < 500 && err.message && err.expose)
        return err.message
    else
        return statusCodes[ code ]
}

function handleError(err, ctx, req, res) {
    const router = ctx.router,
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
    const printable = ctx.status >= 500 && stack

    if (!res.finished && !res.headersSent) {
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
    if (!(err instanceof Error))
        err = new Error(err)

    const router    = ctx.router,
          listeners = router.listenerCount('error')

    if (listeners)
        try {
            router.emit('error', err, ctx, req, res)
        }
        catch (ex) {
            // there is an error in the error event handler
            handleError(err, ctx, req, res)

            const stack = (ex.stack || ex).toString()
            console.error(stack)
        }
    else
        handleError(err, ctx, req, res)
}
