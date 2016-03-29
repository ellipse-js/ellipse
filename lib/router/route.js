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
    MountPoint     = require('./mount'),
    Router         = require('./index'),
    error          = require('./handlers/error').internal,
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

    for (var i = 0, l = handlers.length; i < l; i++)
        this.addHandler(handlers[ i ])

    // store param processor middleware of this route
    for(i = 0, l = keys.length; i < l; i++) {
        var param   = keys[ i ].name,
            handler = router.params[ param ]

        if (param && param in router.params) {
            if(isGenFunc(handler))
                handler = wrap.generatorParamProcessor(handler)
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
        setImmediate(next)
    },

    dispatch: function dispatch(ctx, req, res, options, callback) {
        var handlers = this.handlers,
            method   = this.method,
            //all      = this.all,
            wildcard = this.wildcard,
            i        = 0

        // reference `next()` from `req` and `res`
        req.next = res.next = next

        // start chain
        next()

        function next(err, code, message) {
            var handler = handlers[ i++ ]//,
            //caller  = arguments.callee.caller

            // error: `next()` instead of `yield next` from a generator
            // it should mess up the order of upstream dispatch, so avoid direct calls
            //if(caller && isGenFunc(caller)) {
            //    err  = new Error('Calling `next()` directly from a generator function is not supported. Use `yield next` instead.')
            //    code = message = null
            //}
            //// not really an error, just a `yield next`. we've got a callback function,
            //// save it for upstream dispatch and continue routing this request
            /*else*/ if(err && err instanceof Function) {
                ctx._addCallback(err)
                err = null
            }

            // an error occurred, it's time to stop routing this request
            // and call the error handler
            if(err) {
                err = httpError.apply(null, arguments)
                error(err, ctx, req, res)
            }

            // todo: to be decided...
            //       is it useful?
            //       it can prevent errors if user calls `next` accidentally,
            //       but there are valid use-cases when we want to continue the chain
            //       after the response has been sent

            // somebody called `next()` after `res.end()` by mistake
            // ignore it, warn the user and stop routing this request
            //else if(res.finished) {
            //    console.warn('`next()` called after the response has been sent')
            //    console.trace()
            //}
            // try to call the next handler function
            else if(handler) {
                if (
                    handler instanceof Router ||
                    handler instanceof MountPoint
                )
                    handler.handle(ctx, req, res, next)
                else if (!options)
                    try {
                        handler(ctx, req, res, next)
                    }
                    catch (ex) {
                        error(ex, ctx, req, res)
                    }
                else {
                    if(/*!all && */!wildcard && !~options.indexOf(method))
                        options.push(method)

                    next()
                }
            }
            // no more handlers
            else
                setImmediate(callback)
        }
    },

    processParams: function processParams(params, ctx, req, res, opts, callback) {
        var self = this,
            i    = 0

        // reference `next()` from `req` and `res`
        req.next = res.next = next

        nextParam()

        function next(err, code, message) {
            //var caller = arguments.callee.caller

            // error: `next()` instead of `yield next` from a generator
            // it may mess up the order of upstream dispatch, so avoid direct calls
            //if(caller && isGenFunc(caller)) {
            //    err  = new Error('Calling `next()` directly from a generator function is not supported. Use `yield next` instead.')
            //    code = message = null
            //}
            // not really an error, just a `yield next`. we've got a callback function,
            // save it for upstream dispatch and continue processing params
            /*else*/ if(err instanceof Function) {
                ctx._addCallback(err)
                err = null
            }

            if (err) {
                err = httpError.apply(null, arguments)
                error(err, ctx, req, res)
            }
            else
                setImmediate(nextParam)
        }

        function nextParam() {
            var param = self.params[ i++ ]

            // all params are processed, it's time to execute the handlers of this route
            if (!param)
                self.dispatch(ctx, req, res, opts, callback)
            else
                param.handler(ctx, req, res, next, params[ param.index ])
        }
    },

    addHandler: function addHandler(handler) {
        var fn = handler instanceof Function

        assert(
            fn ||
            handler instanceof Router ||
            handler instanceof MountPoint,
            'request listener must be a function or a `Router` instance'
        )

        if (fn) {
            if (isGenFunc(handler))
                handler = wrap.generatorMiddleware(handler)
            else
                handler = wrap.middleware(handler)
        }

        return this.handlers.push(handler)
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
