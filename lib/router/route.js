'use strict'

// expose

module.exports = Route

// includes

const assert         = require('assert'),
      httpError      = require('http-errors'),
      pathRegexp     = require('path-to-regexp'),
      error          = require('./handlers/error').internal,
      lazy           = require('../utils/lazy'),
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
        path instanceof RegExp ?
            extractKeys(path, keys) :
            pathRegexp(path, keys)

    for (var i = 0, l = handlers.length; i < l; i++)
        this.addHandler(handlers[ i ])

    // store param processor middleware of this route
    for (i = 0, l = keys.length; i < l; i++) {
        var param   = keys[ i ].name,
            handler = router.params[ param ]

        if (param && param in router.params) {
            if (isGenFunc(handler)) {
                handler = lazy.wrapGenerator.paramProcessor(handler)
                handler = new lazy.Composition(handler)
            }
            else
                handler = wrap.paramProcessor(handler)

            params.push({
                index:   i,
                handler: handler
            })
        }
    }
}

// utils

function noop() {}

// instance members

Route.prototype = {
    handle: function handle(ctx, req, res, opts, next) {
        const method = req.method.toLowerCase()
        var   match

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
                const params = req.params = {},
                      keys = this.keys

                // collect `req.params` from the match
                if (match && keys.length)
                    for (var j = 1; j < match.length; j++) {
                        const key  = keys[ j - 1 ],
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
        next()
    },

    dispatch: function dispatch(ctx, req, res, options, callback) {
        const app      = this.router.app,
              handlers = this.handlers,
              method   = this.method,
              wildcard = this.wildcard
        var i = 0

        // start chain
        setImmediate(next)

        function next(err, code, message) {
            const done    = ctx.callback,
                  handler = handlers[ i++ ],
                  args    = arguments

            const p = app._promisify(function (resolve, reject) {
                ctx.callback = resolve

                if (err) {
                    err = httpError.apply(null, args)
                    error(err, ctx, req, res)
                    reject(err)
                }
                else if (handler) {
                    if (!options)
                        try {
                            if (handler.handle)
                                handler.handle(ctx, req, res, next)
                            else
                                handler(ctx, req, res, next)
                        }
                        catch (ex) {
                            err = httpError(ex)
                            error(err, ctx, req, res)
                            reject(err)
                        }
                    else {
                        if (!wildcard && !~options.indexOf(method))
                            options.push(method)

                        next()
                    }
                }
                // no more handlers
                else
                    callback()
            })

            if (p)
                p.then(done, noop)

            return p
        }
    },

    processParams: function processParams(params, ctx, req, res, opts, callback) {
        const self = this,
              app  = this.router.app

        var i = 0

        setImmediate(nextParam)

        function nextParam(err, code, message) {
            const done  = ctx.callback,
                  param = self.params[ i++ ],
                  args  = arguments

            const p = app._promisify(function (resolve, reject) {
                ctx.callback = resolve

                if (err) {
                    err = httpError.apply(null, args)
                    error(err, ctx, req, res)
                    reject(err)
                }
                // all params are processed, so execute handlers of this route
                else if (!param)
                    self.dispatch(ctx, req, res, opts, callback)
                else {
                    const handler = param.handler,
                          value   = params[ param.index ]

                    try {
                        if (handler.handle)
                            handler.handle(ctx, req, res, nextParam, value)
                        else
                            handler(ctx, req, res, nextParam, value)
                    }
                    catch (ex) {
                        err = httpError(ex)
                        error(err, ctx, req, res)
                        reject(err)
                    }
                }
            })

            if (p)
                p.then(done, noop)

            return p
        }
    },

    addHandler: function addHandler(handler) {
        const fn = handler instanceof Function

        assert(
            fn || handler && handler.handle instanceof Function,
            'request listener must be a function or an object with a `handle` method'
        )

        if (fn) {
            if (isGenFunc(handler)) {
                handler = lazy.wrapGenerator.middleware(handler)

                var composition = this._composition

                if (!composition) {
                    composition = this._composition = new lazy.Composition
                    this.handlers.push(composition)
                }

                composition.middleware.push(handler)

            }
            else {
                delete this._composition
                this.handlers.push(wrap.middleware(handler))
            }
        }
        else {
            delete this._composition
            this.handlers.push(handler)
        }
    },

    removeHandler: function removeHandler(index) {
        assert.notEqual(index, undefined, 'no handler specified to remove')

        const handlers = this.handlers

        if (typeof index !== 'number')
            index = handlers.indexOf(index)

        return handlers.splice(index, 1).length
    },

    toJSON: function toJSON() {
        return {
            method:       this.method,
            path:         this.path,
            handlerCount: this.handlers.length
        }
    },

    inspect: function inspect() {
        return this.toJSON()
    }
}
