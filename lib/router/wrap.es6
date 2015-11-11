/**
 * Created by schwarzkopfb on 15/11/6.
 */

var co    = require('co'),
    call  = Function.prototype.call,
    apply = Function.prototype.apply,
    slice = Array.prototype.slice

function wrapGeneratorMiddleware(handler) {
    // execute middleware, handle errors and store the returned promise for upstream dispatch
    switch (handler.length) {
        case 0:
            return function *() {
                //yield setImmediate
                yield *handler.call(this)
            }

        case 1:
            return function *(next) {
                //yield setImmediate
                yield *handler.call(this, next)
            }

        case 2:
            return function *(next) {
                //yield setImmediate
                yield *handler.call(this, this, next)
            }

        case 3:
            return function *(next) {
                //yield setImmediate
                yield *handler.call(this, this.req, this.res, next)
            }

        default:
            return function *(next) {
                //yield setImmediate
                yield *handler.call(this, this, this.req, this.res, next)
            }
    }
}

exports.generatorMiddleware = wrapGeneratorMiddleware

// todo
function wrapGeneratorParamProcessor(handler) {
    // execute param processor, handle errors and store the returned promise for upstream dispatch
    switch (handler.length) {
        case 0:
            return function *(ctx) {
                yield *handler.call(ctx)
            }

        case 1:
            return function *(ctx, req, res, next, param) {
                yield *handler.call(ctx, param)
            }

        case 2:
            return function *(ctx, req, res, next, param) {
                yield *handler.call(ctx, next, param)
            }

        case 3:
            return function (ctx, req, res, next, param) {
                yield *handler.call(ctx, ctx, next, param)
            }

        case 4:
            return function (ctx, req, res, next, param) {
                yield *handler.call(ctx, req, res, next, param)
            }

        default:
            return function (ctx, req, res, next, param) {
                yield *handler.apply(ctx, arguments)
            }
    }
}

exports.generatorParamProcessor = wrapGeneratorParamProcessor

function toPromise(handler) {
    var args = slice.call(arguments, 1)

    return new Promise(function (resolve, reject) {
        function done(err) {
            if(err)
                reject(err)
            else
                resolve()
        }

        args.push(done)

        //setImmediate(function () {
            call.apply(handler, args)
        //})
    })
}

function wrapMiddleware(handler) {
    switch (handler.length) {
        case 0:
            return function *() {
                yield toPromise(handler, this)
            }
            break

        case 1:
            return function *(next) {
                yield toPromise(handler, this)
                yield *next
            }
            break

        case 2:
            return function *() {
                yield toPromise(handler, this, this.req, this.res)
            }
            break

        case 3:
            return function *(next) {
                yield toPromise(handler, this, this.req, this.res)
                yield *next
            }
            break

        case 4:
        default:
            return function *(next) {
                yield toPromise(handler, this, this, this.req, this.res)
                yield *next
            }
    }
}

exports.middleware = wrapMiddleware

// todo
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
