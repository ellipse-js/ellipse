/**
 * Created by schwarzkopfb on 15/11/6.
 */

function wrapGeneratorMiddleware(handler) {
    var length = handler.length, fn

    handler = co.wrap(handler)

    // execute middleware, handle errors and store the returned promise for upstream dispatch
    switch (length) {
        case 0:
            fn = function (next) {
                this._downstream.push(handler.call(this).catch(next))
            }
            break

        case 1:
            fn = function (next) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break

        case 2:
            fn = function (next) {
                this._downstream.push(handler.apply(this, [ this, next ]).catch(next))
            }
            break

        case 3:
            fn = function (req, res, next) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break

        default:
            fn = function (ctx, req, res, next) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
    }

    return fn
}

exports.generatorMiddleware = wrapGeneratorMiddleware

function wrapGeneratorParamProcessor(handler) {
    var length = handler.length, fn

    handler = co.wrap(handler)

    // execute param processor, handle errors and store the returned promise for upstream dispatch
    switch (length) {
        case 0:
            fn = function () {
                this._downstream.push(handler.call(this).catch(this.next))
            }
            break

        case 1:
            fn = function (param) {
                this._downstream.push(handler.apply(this, arguments).catch(this.next))
            }
            break

        case 2:
            fn = function (next, param) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break

        case 3:
            fn = function (ctx, next, param) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break

        case 4:
            fn = function (req, res, next, param) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break

        default:
            fn = function (ctx, req, res, next, param) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break
    }

    return fn
}

exports.generatorParamProcessor = wrapGeneratorParamProcessor
