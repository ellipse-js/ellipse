/**
 * Created by schwarzkopfb on 15/11/6.
 */

'use strict'

// expose

module.exports = Route

// includes

var assert         = require('assert'),
    httpError      = require('http-errors'),
    pathRegexp     = require('path-to-regexp'),
    error          = require('./handlers/error').internal,
    lazy           = require('../utils/lazy'),
    wrap           = require('../utils/wrap'),
    decodeParam    = require('../utils/decodeParam'),
    extractKeys    = require('../utils/extractKeys'),
    isGenFunc      = require('../utils/isGeneratorFunction'),
    hasOwnProperty = Object.prototype.hasOwnProperty

function Route(router, method, path, handlers) {
    assert(
        Array.isArray(handlers),
        'you must pass an array of handlers to instantiate a `Route`'
    )

    var keys   = [],
        params = []

    this.method   = method
    this.all      = method === '*'
    this.path     = path
    this.wildcard = path === '*'
    this.params   = params
    this.keys     = keys
    this.handlers = []
    this.regexp   =
        path instanceof RegExp ?
            extractKeys(path, keys) :
            pathRegexp(path, keys)

    this._generators = []

    for (var i = 0, l = handlers.length; i < l; i++)
        this.addHandler(handlers[ i ])

    // store param processor middleware of this route
    for(i = 0, l = keys.length; i < l; i++) {
        var param   = keys[ i ].name,
            handler = router.params[ param ]

        if (param && param in router.params) {
            if(isGenFunc(handler))
                handler = lazy.compose([
                    lazy.wrapGenerator.paramProcessor(handler)
                ])
            else
                handler = wrap.paramProcessor(handler)

            params.push({
                index: i,
                handler: handler
            })
        }
    }
}

Route.prototype = {
    handle: function handle(ctx, req, res, opts, next) {
        var method = req.method.toLowerCase(),
            match

        // check `req.path` against this route
        if (
            (
                opts ||
                this.all ||
                method === 'head' ||
                this.method === method
            ) &&
            (
                this.wildcard ||
                (match = this.regexp.exec(req.path))
            )
        ) {
            if (opts)
                this.dispatch(ctx, req, res, opts, next)
            else {
                var params = req.params = {},
                    keys   = this.keys

                // collect `req.params` from the match
                if (match && keys.length)
                    for (var j = 1; j < match.length; j++) {
                        var key  = keys[ j - 1 ],
                            prop = key.name,
                            val  = decodeParam(match[ j ])

                        if (val !== undefined || !(hasOwnProperty.call(params, prop)))
                            params[ prop ] =
                                params[ j - 1 ] = val
                    }

                // there are params to process first
                if (this.params.length)
                    this.processParams(params, ctx, req, res, opts, next)
                // let's start the middleware chain for this route
                else
                    this.dispatch(ctx, req, res, opts, next)
            }

            return
        }

        // not matching
        //setImmediate(next)
        next()
    },

    dispatch: function dispatch(ctx, req, res, options, callback) {
        var handlers = this.handlers,
            method   = this.method,
            wildcard = this.wildcard,
            i        = 0

        // start chain
        setImmediate(next)

        function next(err, code, message) {
            var handler = handlers[ i++ ]

            if(err) {
                err = httpError.apply(null, arguments)
                error(err, ctx, req, res)
            }
            else if(handler) {
                if (handler.handle)
                    handler.handle(ctx, req, res, next)
                else if (!options)
                    try {
                        handler(ctx, req, res, next)
                    }
                    catch (ex) {
                        error(ex, ctx, req, res)
                    }
                else {
                    if(!wildcard && !~options.indexOf(method))
                        options.push(method)

                    next()
                }
            }
            // no more handlers
            else
                callback()
        }
    },

    processParams: function processParams(params, ctx, req, res, opts, callback) {
        var self = this,
            i    = 0

        setImmediate(nextParam)

        function nextParam(err, code, message) {
            var param = self.params[ i++ ]

            if (err) {
                err = httpError.apply(null, arguments)
                error(err, ctx, req, res)
            }
            // all params are processed, it's time to execute the handlers of this route
            else if (!param)
                self.dispatch(ctx, req, res, opts, callback)
            else
                param.handler(ctx, req, res, nextParam, params[ param.index ])
        }
    },

    addHandler: function addHandler(handler) {
        var fn = handler instanceof Function

        assert(
            fn || handler.handle instanceof Function,
            'request listener must be a function or an object with a `handle` method'
        )

        if (fn) {
            if (isGenFunc(handler)) {
                handler = lazy.wrapGenerator.middleware(handler)

                if (!this._generators.length)
                    this.handlers.push(lazy.compose(this._generators))

                this._generators.push(handler)
            }
            else {
                this._generators = [] // reset array and create new ref
                this.handlers.push(wrap.middleware(handler))
            }
        }
        else {
            this._generators = [] // reset array and create new ref
            this.handlers.push(handler)
        }
    },

    removeHandler: function removeHandler(index) {
        assert.notEqual(index, undefined, 'no handler specified to remove')

        var handlers = this.handlers

        if(typeof index !== 'number')
            index = handlers.indexOf(index)

        handlers.splice(index, 1)
        return handlers.length
    },

    toJSON: function toJSON() {
        return {
            method: this.method,
            path: this.path,
            handlerCount: this.handlers.length
        }
    },

    inspect: function inspect() {
        return this.toJSON()
    }
}
