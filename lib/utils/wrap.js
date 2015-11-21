/**
 * Created by schwarzkopfb on 15/11/6.
 */

'use strict';

var co   = require('co'),
    call = Function.prototype.call

function wrapGeneratorMiddleware(handler) {
    var length = handler.length

    handler = co.wrap(handler)

    // execute middleware, handle errors and store the returned promise for upstream dispatch
    switch (length) {
        case 0:
            return function (ctx, req, res, next) {
                ctx._downstream.push(handler.call(ctx).catch(next))
            }

        case 1:
            return function (ctx, req, res, next) {
                ctx._downstream.push(handler.call(ctx, next).catch(next))
            }

        case 2:
            return function (ctx, req, res, next) {
                ctx._downstream.push(handler.call(ctx, ctx, next).catch(next))
            }

        case 3:
            return function (ctx, req, res, next) {
                ctx._downstream.push(handler.call(ctx, req, res, next).catch(next))
            }

        default:
            return function (ctx, req, res, next) {
                ctx._downstream.push(handler.apply(ctx, arguments).catch(next))
            }
    }
}

exports.generatorMiddleware = wrapGeneratorMiddleware

function wrapGeneratorParamProcessor(handler) {
    var length = handler.length

    handler = co.wrap(handler)

    // execute param processor, handle errors and store the returned promise for upstream dispatch
    switch (length) {
        case 0:
            return function (ctx, req, res, next) {
                ctx._downstream.push(handler.call(ctx).catch(next))
            }

        case 1:
            return function (ctx, req, res, next, param) {
                ctx._downstream.push(handler.call(ctx, param).catch(next))
            }

        case 2:
            return function (ctx, req, res, next, param) {
                ctx._downstream.push(handler.call(ctx, next, param).catch(next))
            }

        case 3:
            return function (ctx, req, res, next, param) {
                ctx._downstream.push(handler.call(ctx, ctx, next, param).catch(next))
            }

        case 4:
            return function (ctx, req, res, next, param) {
                ctx._downstream.push(handler.call(ctx, req, res, next, param).catch(next))
            }

        default:
            return function (ctx, req, res, next, param) {
                ctx._downstream.push(handler.apply(ctx, arguments).catch(next))
            }
    }
}

exports.generatorParamProcessor = wrapGeneratorParamProcessor

function wrapMiddleware(handler) {
    var wrapped

    switch (handler.length) {
        case 0:
            wrapped = function (ctx) {
                call.call(handler, ctx)
            }
            break

        case 1:
            wrapped = function (ctx, req, res, next) {
                call.call(handler, ctx, next)
            }
            break

        case 2:
            wrapped = function (ctx, req, res) {
                call.call(handler, ctx, req, res)
            }
            break

        case 3:
            wrapped = function (ctx, req, res, next) {
                call.call(handler, ctx, req, res, next)
            }
            break

        case 4:
        default:
            wrapped = function (ctx, req, res, next) {
                call.call(handler, ctx, ctx, req, res, next)
            }
    }

    if(handler._prepareForUse || handler._isRouter)
        wrapped._subroute = true

    return wrapped
}

exports.middleware = wrapMiddleware

function wrapParamProcessor(handler) {
    switch (handler.length) {
        case 0:
            return function (ctx) {
                call.call(handler, ctx)
            }
            break
        
        case 1:
            return function (ctx, req, res, next, param) {
                call.call(handler, ctx, param)
            }
            break

        case 2:
            return function (ctx, req, res, next, param) {
                call.call(handler, ctx, next, param)
            }
            break

        case 3:
            return function (ctx, req, res, next, param) {
                call.call(handler, ctx, ctx, next, param)
            }
            break

        case 4:
            return function (ctx, req, res, next, param) {
                call.call(handler, ctx, req, res, next, param)
            }
            break

        case 5:
        default:
            return function (ctx, req, res, next, param) {
                call.call(handler, ctx, ctx, req, res,next, param)
            }
    }
}

exports.paramProcessor = wrapParamProcessor
