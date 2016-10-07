'use strict'

// expose

exports = module.exports = wrapMiddleware
exports.paramProcessor = wrapParamProcessor

// methods

function wrapMiddleware(handler) {
    var fn

    switch (handler.length) {
        case 0:
            fn = function (next) {
                this._req.next = this._res.next = next
                handler.call(this)
            }
            break

        case 1:
            fn = function (next) {
                this._req.next = this._res.next = next
                handler.call(this, next)
            }
            break

        case 2:
            fn = function (next) {
                this._req.next = this._res.next = next
                handler.call(this, this._req, this._res)
            }
            break

        case 3:
            fn = function (next) {
                this._req.next = this._res.next = next
                handler.call(this, this._req, this._res, next)
            }
            break

        //case 4:
        default:
            fn = function (next) {
                this._req.next = this._res.next = next
                handler.call(this, this, this._req, this._res, next)
            }
    }

    return retain(fn, handler)
}

function wrapParamProcessor(handler) {
    var fn

    switch (handler.length) {
        case 0:
            fn = function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this)
            }
            break

        case 1:
            fn = function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this, param)
            }
            break

        case 2:
            fn = function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this, next, param)
            }
            break

        case 3:
            fn = function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this, this, next, param)
            }
            break

        case 4:
            fn = function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this, this._req, this._res, next, param)
            }
            break

        //case 5:
        default:
            fn = function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this, this, this._req, this._res, next, param)
            }
    }

    return retain(fn, handler)
}

function retain(fn, orig) {
    return Object.defineProperties(fn, {
        name:     { value: orig.name },
        length:   { value: orig.length },
        toString: { value: orig.toString.bind(orig) }
    })
}
