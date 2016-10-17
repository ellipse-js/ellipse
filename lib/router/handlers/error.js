'use strict'

// expose

module.exports = error

// includes

const statusCodes = require('http').STATUS_CODES

// methods

function getErrorMessage(err) {
    const code = err.status

    if (code >= 400 && code < 500 && err.message && err.expose)
        return err.message
    else
        return statusCodes[ code ]
}

function handleError(err, ctx) {
    const parent = ctx.router.parent,
          env    = ctx.app.env,
          req    = ctx.req,
          res    = ctx.res

    // there is a parent router that probably has a custom error handler
    // so delegate error to parent
    if (parent) {
        req.router = res.router = parent
        error(err, ctx)
        return
    }

    if (err.status)
        ctx.status = err.status

    const message = getErrorMessage(err)

    if (!res.headersSent)
        ctx.message = message

    if (!res.finished) {
        ctx.text = message

        if (env === 'development' && !err.expose)
            ctx.text += '\n\n' + err.stack

        ctx.send()
    }

    if (env !== 'test' && !err.expose)
        console.error(err.stack)
}

function error(err, ctx) {
    const router    = ctx.router,
          listeners = router.listenerCount('error')

    if (listeners)
        try {
            router.emit('error', err, ctx)
        }
        catch (ex) {
            // there is an error in the error event handler
            handleError(err, ctx)
        }
    else
        handleError(err, ctx)
}
