'use strict'

// expose

module.exports = Route

// includes

const assert         = require('assert'),
      httpError      = require('http-errors'),
      pathRegexp     = require('path-to-regexp'),
      Mount          = require('./mount'),
      Router         = require('.'),
      Composition    = require('./composition'),
      error          = require('./handlers/error').internal,
      Deferred       = require('../utils/deferred'),
      wrap           = require('../utils/wrap'),
      decodeParam    = require('../utils/decodeParam'),
      extractKeys    = require('../utils/extractKeys'),
      isGenFunc      = require('../utils/isGenerator').isFunction,
      hasOwnProperty = Object.prototype.hasOwnProperty

// constructor

function Route(router, method, path, handlers) {
    assert(
        Array.isArray(handlers),
        'you must pass an array of handlers to instantiate a `Route`'
    )

    const keys   = [],
          params = []

    this.router   = router
    this.method   = method
    this.all      = method === '*'
    this.path     = path
    this.wildcard = path === '*'
    this.params   = params
    this.keys     = keys
    this.handlers = []
    this.regexp   =
        path instanceof RegExp
            ? extractKeys(path, keys)
            : pathRegexp(path, keys)

    for (var i = 0, l = handlers.length; i < l; i++)
        this.addHandler(handlers[ i ])

    // store param processor middleware of this route
    for (i = 0, l = keys.length; i < l; i++) {
        var param   = keys[ i ].name,
            handler = router.params[ param ]

        if (param && param in router.params) {
            if (isGenFunc(handler))
                handler = new Composition(handler)
            else
                handler = wrap.paramProcessor(handler)

            params.push({
                index: i,
                handler: handler
            })
        }
    }
}

// instance members

Route.prototype = {
    get length() {
        return this.handlers.length
    },

    handle: function handle(ctx, req, res, opts, next) {
        const path = req.path
        var match, method = req.method.toLowerCase()

        // treat HEAD request as GET if no explicit handler attached to it
        if (!opts && !this.all && method === 'head')
            if (!this.router._matchHead(path))
                method = 'get'

        // check `req.path` against this route
        if (
            (opts || this.all || this.method === method) &&
            (this.wildcard || (match = this.regexp.exec(path)))
        ) {
            // it's an OPTIONS request, we're not going to execute handlers,
            // so there is no need to set `req.params`
            if (opts)
                this.dispatch(ctx, req, res, opts, next)
            else {
                const params = req.params = {},
                      keys = this.keys

                // collect `req.params` from the match
                if (match && keys.length)
                    for (var j = 1; j < match.length; j++) {
                        const key  = keys[ j - 1 ],
                              prop = key.name,
                              val  = decodeParam(match[ j ])

                        if (val !== undefined || !(hasOwnProperty.call(params, prop)))
                            params[ prop ] = // named param
                            params[ j - 1 ] = val // capturing group
                    }

                // there are registered param processors, execute them first
                if (this.params.length)
                    this.processParams(params, ctx, req, res, opts, next)
                // let's start the middleware chain for this route
                else
                    this.dispatch(ctx, req, res, opts, next)
            }
        }
        // not matching, go forward
        else
            next()
    },

    dispatch: function dispatch(ctx, req, res, options, callback) {
        const all      = this.all,
              method   = this.method,
              handlers = this.handlers,
              wildcard = this.wildcard,
              upstream = this.router.app.upstream

        var i = 0

        // start chain
        setImmediate(next)

        function next(err, code, message) {
            const prev    = ctx._deferred,
                  curr    = Deferred.createIf(upstream),
                  handler = handlers[ i++ ]

            ctx._deferred = curr

            if (prev && curr)
                curr.promise.then(prev.resolve, prev.reject)

            // user passed an error to next(), break this chain and go to the error handler
            if (err) {
                err = httpError.apply(null, arguments)
                error(err, ctx, req, res)

                if (curr)
                    curr.reject(err)
            }
            // there is another handler in this chain, execute it!
            else if (handler) {
                // it's an OPTIONS request, we don't need to execute the handler,
                // just collect allowed verbs
                if (options) {
                    // store current verb if not already added
                    if (!all && !wildcard && !~options.indexOf(method))
                        options.push(method)

                    // it's a sub-router that has its own routes,
                    // pass the control to it
                    if (handler instanceof Router)
                        handler.dispatch(ctx, req, res, next)
                    // it's a mount point, we need to execute it
                    // before we reach a sub-router
                    else if (handler instanceof Mount)
                        handler.handle(ctx, req, res, next)
                    // go forward
                    else
                        next()
                }
                else
                    try {
                        // plugin with a handle() method
                        if (handler.handle)
                            handler.handle(ctx, req, res, next)
                        // middleware function
                        else
                            handler.call(ctx, next)
                    }
                    // catch errors in middleware
                    catch (ex) {
                        err = httpError(ex)
                        error(err, ctx, req, res)

                        if (curr)
                            curr.reject(err)
                    }
            }
            // no more handlers
            else
                callback()

            if (curr)
                return curr.promise
        }
    },

    processParams: function processParams(params, ctx, req, res, opts, next) {
        const self     = this,
              upstream = this.router.app.upstream

        var i = 0

        setImmediate(nextParam)

        function nextParam(err, code, message) {
            const prev  = ctx._deferred,
                  curr  = Deferred.createIf(upstream),
                  param = self.params[ i++ ],
                  args  = arguments

            ctx._deferred = curr

            if (prev && curr)
                curr.promise.then(prev.resolve, prev.reject)

            // user passed an error to next(), break this chain and go to the error handler
            if (err) {
                err = httpError.apply(null, args)
                error(err, ctx, req, res)

                if (curr)
                    curr.reject(err)
            }
            // all params are processed, so execute handlers of this route
            else if (!param)
                self.dispatch(ctx, req, res, opts, next)
            else {
                const handler = param.handler,
                      value   = params[ param.index ]

                try {
                    // plugin with a handle() method
                    if (handler.handle)
                        handler.handle(ctx, req, res, nextParam, value)
                    // middleware function
                    else
                        handler.call(ctx, nextParam, value)
                }
                // catch errors in middleware
                catch (ex) {
                    err = httpError(ex)
                    error(err, ctx, req, res)

                    if (curr)
                        curr.reject(err)
                }
            }

            if (curr)
                return curr.promise
        }
    },

    addHandler: function addHandler(handler) {
        const fn = typeof handler === 'function'

        assert(
            fn || handler && typeof handler.handle === 'function',
            'request listener must be a function or an object with a `handle()` method'
        )

        if (fn) {
            // compose generator middleware that are passed consecutively
            if (isGenFunc(handler)) {
                var composition = this._composition

                // it's the first generator, create a new composition
                if (!composition) {
                    composition = this._composition = new Composition
                    this.handlers.push(composition)
                }

                // add handler to the composition
                composition.middleware.push(handler)
            }
            // it's a classic middleware, reset composition if there is one
            else {
                delete this._composition
                this.handlers.push(wrap(handler))
            }
        }
        // it's a plugin, reset composition if there is one
        else {
            delete this._composition
            this.handlers.push(handler)
        }
    },

    toJSON: function toJSON() {
        return {
            method:       this.method,
            path:         this.path,
            handlerCount: this.length
        }
    },

    inspect: function inspect() {
        return this.toJSON()
    }
}
