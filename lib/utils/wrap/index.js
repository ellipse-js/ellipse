/**
 * Created by schwarzkopfb on 16/3/30.
 */

'use strict'

// expose

module.exports = {
    middleware:     wrapMiddleware,
    paramProcessor: wrapParamProcessor
}

// methods

function wrapMiddleware(handler) {
    switch (handler.length) {
        case 0:
            return function (ctx) {
                handler.call(ctx)
            }

        case 1:
            return function (ctx, req, res, next) {
                handler.call(ctx, next)
            }

        case 2:
            return function (ctx, req, res) {
                handler.call(ctx, req, res)
            }

        case 3:
            return function (ctx, req, res, next) {
                handler.call(ctx, req, res, next)
            }

        //case 4:
        default:
            return function (ctx, req, res, next) {
                handler.apply(ctx, arguments)
            }
    }
}

function wrapParamProcessor(handler) {
    switch (handler.length) {
        case 0:
            return function (ctx) {
                handler.call(ctx)
            }

        case 1:
            return function (ctx, req, res, next, param) {
                handler.call(ctx, param)
            }

        case 2:
            return function (ctx, req, res, next, param) {
                handler.call(ctx, next, param)
            }

        case 3:
            return function (ctx, req, res, next, param) {
                handler.call(ctx, ctx, next, param)
            }

        case 4:
            return function (ctx, req, res, next, param) {
                handler.call(ctx, req, res, next, param)
            }

        //case 5:
        default:
            return function (ctx, req, res, next, param) {
                handler.apply(ctx, arguments)
            }
    }
}

