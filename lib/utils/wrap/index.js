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
            return function (ctx, req, res, next) {
                req.next = res.next = next
                handler.call(ctx)
            }

        case 1:
            return function (ctx, req, res, next) {
                req.next = res.next = next
                handler.call(ctx, next)
            }

        case 2:
            return function (ctx, req, res, next) {
                req.next = res.next = next
                handler.call(ctx, req, res)
            }

        case 3:
            return function (ctx, req, res, next) {
                req.next = res.next = next
                handler.call(ctx, req, res, next)
            }

        //case 4:
        default:
            return function (ctx, req, res, next) {
                req.next = res.next = next
                handler.apply(ctx, arguments)
            }
    }
}

function wrapParamProcessor(handler) {
    switch (handler.length) {
        case 0:
            return function (ctx, req, res, next) {
                req.next = res.next = next
                handler.call(ctx)
            }

        case 1:
            return function (ctx, req, res, next, param) {
                req.next = res.next = next
                handler.call(ctx, param)
            }

        case 2:
            return function (ctx, req, res, next, param) {
                req.next = res.next = next
                handler.call(ctx, next, param)
            }

        case 3:
            return function (ctx, req, res, next, param) {
                req.next = res.next = next
                handler.call(ctx, ctx, next, param)
            }

        case 4:
            return function (ctx, req, res, next, param) {
                req.next = res.next = next
                handler.call(ctx, req, res, next, param)
            }

        //case 5:
        default:
            return function (ctx, req, res, next, param) {
                req.next = res.next = next
                handler.apply(ctx, arguments)
            }
    }
}
