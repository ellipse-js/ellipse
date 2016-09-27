'use strict'

// expose

module.exports = {
    middleware:     wrapGeneratorMiddleware,
    paramProcessor: wrapGeneratorParamProcessor
}

// methods

function wrapGeneratorMiddleware(handler) {
    switch (handler.length) {
        case 0:
            return function *(ctx, req, res, next) {
                req.next = res.next = next
                yield *handler.call(ctx)
            }

        case 1:
            return function *(ctx, req, res, next) {
                req.next = res.next = next
                yield *handler.call(ctx, next)
            }

        case 2:
            return function *(ctx, req, res, next) {
                req.next = res.next = next
                yield *handler.call(ctx, ctx, next)
            }

        case 3:
            return function *(ctx, req, res, next) {
                req.next = res.next = next
                yield *handler.call(ctx, req, res, next)
            }

        default:
            return function *(ctx, req, res, next) {
                req.next = res.next = next
                yield *handler.apply(ctx, arguments)
            }
    }
}

function wrapGeneratorParamProcessor(handler) {
    switch (handler.length) {
        case 0:
            return function *(ctx, req, res, next, param) {
                req.next = res.next = next
                yield *handler.call(ctx)
            }

        case 1:
            return function *(ctx, req, res, next, param) {
                req.next = res.next = next
                yield *handler.call(ctx, param)
            }

        case 2:
            return function *(ctx, req, res, next, param) {
                req.next = res.next = next
                yield *handler.call(ctx, next, param)
            }

        case 3:
            return function *(ctx, req, res, next, param) {
                req.next = res.next = next
                yield *handler.call(ctx, ctx, next, param)
            }

        case 4:
            return function *(ctx, req, res, next, param) {
                req.next = res.next = next
                yield *handler.call(ctx, req, res, next, param)
            }

        // case 5:
        default:
            return function *(ctx, req, res, next, param) {
                req.next = res.next = next
                yield *handler.apply(ctx, arguments)
            }
    }
}
