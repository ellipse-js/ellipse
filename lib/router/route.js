/**
 * Created by schwarzkopfb on 15/11/6.
 */

var assert              = require('assert'),
    pathRegexp          = require('path-to-regexp'),
    hasOwnProperty      = Object.prototype.hasOwnProperty,
    wrap                = require('./wrap'),
    utils               = require('../utils'),
    error               = utils.error,
    decodeParam         = utils.decodeParam,
    isGeneratorFunction = utils.isGeneratorFunction

function Route(router, method, path, handlers) {
    assert(
        Array.isArray(handlers),
        'You must pass an array of handler functions to instantiate a `Route`.'
    )

    // validate handlers and wrap generator functions
    for(i = 0, l = handlers.length; i < l; i++) {
        handler = handlers[ i ]

        if(isGeneratorFunction(handler))
            handlers[ i ] = wrap.generatorMiddleware(handler)
        else
            handlers[ i ] = wrap.middleware(handler)
    }

    var keys   = [],
        params = []

    this.method   = new String(method)
    this.all      = method === '*'
    this.path     = path
    this.wildcard = path === '*'
    this.keys     = keys
    this.params   = params
    this.regexp   = pathRegexp(path, keys)
    this.handlers = handlers

    this.method[ method ] = true

    // store param processor middleware of this route
    for(var i = 0, l = keys.length; i < l; i++) {
        var param   = keys[ i ].name,
            handler = router.params[ param ]

        if (param && param in router.params) {
            if(isGeneratorFunction(handler))
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

Object.defineProperties(Route.prototype, {
    handle: {
        value: function (ctx, req, res, opts, next) {
            var method = req.method.toLowerCase(),
                match

            // check `req.path` against this route
            if (
                (
                    opts ||
                    this.all ||
                    method === 'head' ||
                    this.method == method
                ) &&
                (
                    this.wildcard ||
                    (match = ctx._match = this.regexp.exec(req.path))
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
                                params[ prop ] = val
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
        }
    },

    dispatch: {
        value: function dispatch(ctx, req, res, options, fn) {
            var handlers = this.handlers,
                method   = this.method.toString(),
                all      = this.all,
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
                //if(caller && isGeneratorFunction(caller)) {
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
                    if(code)
                        err.status  = code

                    if(message)
                        err.message = message

                    error(err, ctx, req, res)
                }
                // todo: is it useful?
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
                    if(!options || handler._subroute)
                        try {
                            handler(ctx, req, res, next)
                        }
                        catch (ex) {
                            error(ex, ctx, req, res)
                        }
                    else {
                        if(!all && !wildcard && !~options.indexOf(method))
                            options.push(method)

                        next()
                    }
                }
                // no more handlers
                else
                    setImmediate(fn)
            }
        }
    },

    processParams: {
        value: function processParams(params, ctx, req, res, opts, fn) {
            var self = this,
                i    = 0

            // reference `next()` from `req` and `res`
            req.next = res.next = next

            nextParam()

            function next(err, code, message) {
                //var caller = arguments.callee.caller

                // error: `next()` instead of `yield next` from a generator
                // it should mess up the order of upstream dispatch, so avoid direct calls
                //if(caller && isGeneratorFunction(caller)) {
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
                    if(code)
                        err.status = code

                    if(message)
                        err.message = message

                    error(err, ctx, req, res)
                }
                else
                    setImmediate(nextParam)
            }

            function nextParam() {
                var param = self.params[ i++ ]

                if (!param)
                    self.dispatch(ctx, req, res, opts, fn)
                else
                    // index + 1 because first item of `match` is the whole route (you know, `regexp.match()`...)
                    param.handler(ctx, req, res, next, ctx._match[ param.index + 1 ])
            }
        }
    },

    toJSON: {
        value: function toJSON() {
            return {
                method: this.method.toString(),
                path: this.path,
                handlerCount: this.handlers.length
            }
        }
    },

    inspect: {
        value: function inspect() {
            return this.toJSON()
        }
    }
})

module.exports = Route
