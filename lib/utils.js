/**
 * Created by schwarzkopfb on 15/11/6.
 */

"use strict";

var statusCodes = require('http').STATUS_CODES

function isGenerator(obj) {
    return obj.next instanceof Function && typeof obj.throw instanceof Function
}

exports.isGenerator = isGenerator

function isGeneratorFunction(obj) {
    var constructor = obj.constructor

    if (!constructor)
        return false
    else if (constructor.name === 'GeneratorFunction' || constructor.displayName === 'GeneratorFunction')
        return true
    else
        return isGenerator(constructor.prototype)
}

exports.isGeneratorFunction = isGeneratorFunction

function getErrorMessage(err) {
    var code = +(err.status || err.statusCode || err.statusMessage) || 500

    if(code !== 500 && code >= 400 && code < 600 && err.message)
        return err.message
    else
        return statusCodes[ code ]
}

function handleError(err, ctx, req, res) {
    var router = ctx.router,
        stack  = (err.stack || err).toString(),
        env    = ctx.app.env

    // there is a parent router, that probably has a custom error handler registered
    // so delegate error to the parent
    if (router.parent) {
        req.router = res.router = router.parent

        return error(err, ctx, req, res)
    }

    ctx.type = 'text/plain'
    ctx.body = ctx.message = getErrorMessage(err)

    if (err.status || err.statusCode)
        ctx.code = err.status
    else if (!ctx.code || ctx.code === 200)
        ctx.code = 500

    var printable = ctx.code === 500 && stack

    if (env !== 'production' && env !== 'test' && printable)
        ctx.body += '\n\n' + stack

    ctx.send()

    if (env !== 'test' && printable)
        console.error(stack)
}

exports.handleError = handleError

function error(err, ctx, req, res) {
    if(!(err instanceof Error))
        err = new Error(err)

    // save error to context. used to check state before upstream dispatching
    ctx._error = err

    var router    = ctx.router,
        listeners = router.listenerCount('error')

    if(!res.finished) {
        if(listeners)
            router.emit('error', err, ctx, req, res)
        else
            handleError(err, ctx, req, res)
    }
    else
        console.error(err.stack || err)
}

exports.error = error

function handleMissing(req, res) {
    res.status(404).send('Cannot ' + req.method + ' ' + req.originalUrl)
}

exports.handleMissing = handleMissing

function upperCase(string) {
    return string.toUpperCase()
}

function handleOptions(options, res) {
    var body = options.map(upperCase).join(','),
        head = res.headers

    head[ 'Content-Length' ] = Buffer.byteLength(body)

    if(options.length)
        head[ 'Allow' ] = body

    res.writeHead(200, head)
    res.end(body)
}

exports.handleOptions = handleOptions

function decodeParam(val) {
    if (typeof val !== 'string' || val.length === 0)
        return val

    try {
        return decodeURIComponent(val)
    }
    catch (err) {
        if (err instanceof URIError) {
            err.message = 'Failed to decode param \'' + val + '\''
            err.status = err.statusCode = 400
        }

        throw err
    }
}

exports.decodeParam = decodeParam
