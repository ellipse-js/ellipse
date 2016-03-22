/**
 * Created by schwarzkopfb on 15/11/21.
 */

'use strict'

var methods = require('methods'),
    slice   = Array.prototype.slice

function RouteDelegate(router, path) {
    this.path   = path
    this.router = router
}

// instance members

Object.defineProperties(RouteDelegate.prototype, {
    all: {
        value: function (handlers) {
            var args   = slice.call(arguments),
                router = this.router

            args.unshift(this.path)
            router.all.apply(router, args)

            return this
        }
    },

    // `.use()` and `.all()` are the same in this case
    use: {
        value: function (handlers) {
            return this.all.apply(this, arguments)
        }
    },

    // alias `.delete()` as `.del()`
    del: {
        value: function (handlers) {
            return this.delete.apply(this, arguments)
        }
    },

    toJSON: {
        value: function () {
            return {
                path: this.path
            }
        }
    },

    inspect: {
        value: function () {
            return this.toJSON()
        }
    }
})

// delegate verb methods

function lowerCase(string) {
    return string.toLowerCase()
}

methods.map(lowerCase).forEach(function (method) {
    Object.defineProperty(RouteDelegate.prototype, method, {
        value: function (handlers) {
            var args   = slice.call(arguments),
                router = this.router

            args.unshift(method, this.path)
            router.addRoute.apply(router, args)

            return this
        }
    })
})

// expose

module.exports = RouteDelegate
