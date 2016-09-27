'use strict'

// expose

exports = module.exports = wrapMiddleware
exports.paramProcessor = wrapParamProcessor

// methods

function wrapMiddleware(handler) {
    switch (handler.length) {
        case 0:
            return function (next) {
                this._req.next = this._res.next = next
                handler.call(this)
            }

        case 1:
            return function (next) {
                this._req.next = this._res.next = next
                handler.call(this, next)
            }

        case 2:
            return function (next) {
                this._req.next = this._res.next = next
                handler.call(this, this._req, this._res)
            }

        case 3:
            return function (next) {
                this._req.next = this._res.next = next
                handler.call(this, this._req, this._res, next)
            }

        //case 4:
        default:
            return function (next) {
                this._req.next = this._res.next = next
                handler.call(this, this, this._req, this._res, next)
            }
    }
}

function wrapParamProcessor(handler) {
    switch (handler.length) {
        case 0:
            return function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this)
            }

        case 1:
            return function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this, param)
            }

        case 2:
            return function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this, next, param)
            }

        case 3:
            return function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this, this, next, param)
            }

        case 4:
            return function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this, this._req, this._res, next, param)
            }

        //case 5:
        default:
            return function (next, param) {
                this._req.next = this._res.next = next
                handler.call(this, this, this._req, this._res, next, param)
            }
    }
}
