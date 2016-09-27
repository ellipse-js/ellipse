'use strict'

// expose

module.exports = RouteDelegate

// includes

const slice = Array.prototype.slice,
      verbs = require('../utils/verbs')

// constructor

function RouteDelegate(router, path) {
    this.path   = path
    this.router = router
}

// instance members

RouteDelegate.prototype = {
    all: function all(handlers) {
        const args   = slice.call(arguments),
              router = this.router

        args.unshift(this.path)
        router.all.apply(router, args)

        return this
    },

    use: function use(handlers) {
        // `use(...)` and `all(...)` are the same in this case, but `all(...)` is faster
        return this.all.apply(this, arguments)
    },

    toJSON: function toJSON() {
        return {
            path: this.path
        }
    },

    inspect: function inspect() {
        return this.toJSON()
    }
}

// verb method aliases

verbs(RouteDelegate, verb => function (handlers) {
    const args   = slice.call(arguments),
          router = this.router

    args.unshift(verb, this.path)
    router.addRoute.apply(router, args)

    return this
})
