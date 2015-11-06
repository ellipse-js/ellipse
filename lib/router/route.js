/**
 * Created by schwarzkopfb on 15/11/6.
 */

var assert              = require('assert'),
    pathRegexp          = require('path-to-regexp'),
    Router              = require('.'),
    wrap                = require('./wrap'),
    isGeneratorFunction = require('../utils').isGeneratorFunction

function Route(router, method, path, handlers) {
    assert(
        Array.isArray(handlers),
        'You must pass an array of handler functions to instantiate a `Route`.'
    )

    // validate handlers and wrap generator functions
    for(i = 0, l = handlers.length; i < l; i++) {
        handler = handlers[ i ]

        assert(
            handler instanceof Function ||
            handler instanceof Router,
            'Request handler must be a function or a `Router` instance.'
        )

        if(isGeneratorFunction(handler))
            handlers[ i ] = wrap.generatorMiddleware(handler)
    }

    var keys   = [],
        params = []

    // store param processor middlewares of this route
    for(var i = 0, l = keys.length; i < l; i++) {
        var param   = keys[ i ].name,
            handler = router.params[ param ]

        if (param && param in router.params) {
            if(isGeneratorFunction(handler))
                handler = wrap.generatorParamProcessor(handler)

            params.push({
                index: i,
                handler: handler
            })
        }
    }

    this.method   = method
    this.path     = path
    this.keys     = keys
    this.params   = params
    this.regexp   = pathRegexp(path, keys)
    this.handlers = handlers
}

module.exports = Route
