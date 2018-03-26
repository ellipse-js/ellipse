'use strict'

// expose

module.exports = Route

// includes

const assert         = require('assert'),
      pathRegexp     = require('path-to-regexp'),
      Mount          = require('./mount'),
      Router         = require('.'),
      decodeParam    = require('../utils/decodeParam'),
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
    this.regexp   = pathRegexp(path, keys)

    for (let i = 0, l = handlers.length; i < l; i++)
        this.addHandler(handlers[ i ])

    // store param processor middleware of this route
    for (let i = 0, l = keys.length; i < l; i++) {
        const param   = keys[ i ].name,
              handler = router.params[ param ]

        if (param && param in router.params)
            params.push({
                index: i,
                handler: handler
            })
    }
}

// instance members

Route.prototype = {
    get length() {
        return this.handlers.length
    },

    handle: function handle(ctx, req, res, opts, next) {
        const path = req.path
        let match, method = req.method.toLowerCase()

        // treat HEAD request as GET if no explicit handler attached to it
        if (!opts && !this.all && method === 'head')
            if (!this.router._matchHead(path))
                method = 'get'

        // check `req.path` against this route
        if (
            (opts || this.all || this.method === method) &&
            (this.wildcard || (match = ctx.matched = this.regexp.exec(path)))
        ) {
            // this route is able to handle OPTIONS, so
            // don't respond automatically
            if (opts && this.method === 'options')
                opts = null

            // we need to auto-generate response for OPTIONS
            if (opts)
                this.dispatch(ctx, req, res, opts, next)
            else {
                const params = req.params = {},
                      keys = this.keys

                // collect `req.params` from the match
                if (match && keys.length)
                    for (let j = 1; j < match.length; j++) {
                        const key  = keys[ j - 1 ],
                              prop = key.name,
                              val  = decodeParam(match[ j ])

                        if (val !== undefined || !(hasOwnProperty.call(params, prop)))
                            params[ prop ] = // named param
                            params[ j - 1 ] = val // capturing group
                    }

                // there are registered param processors, execute them first
                if (this.params.length)
                    return this.processParams(params, ctx, req, res, opts, next)
                // let's start the middleware chain for this route
                else
                    return this.dispatch(ctx, req, res, opts, next)
            }
        }
        // not matching, go forward
        else
            return Promise.resolve(next())
    },

    dispatch: function dispatch(ctx, req, res, options, callback) {
        const all      = this.all,
              method   = this.method,
              router   = this.router,
              handlers = this.handlers,
              wildcard = this.wildcard

        // start chain
        return dispatch(0)

        function dispatch(i) {
            const handler = handlers[ i ]

            ctx.next = req.next = res.next = next

            // there is another handler in this chain, execute it!
            if (handler) {
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
                        let val

                        // plugin (stateful middleware)
                        if (handler.handle)
                            val = handler.handle(ctx, req, res, next)
                        // middleware function
                        else
                            val = handler(ctx, next)

                        return Promise.resolve(val)
                    }
                    // catch errors in middleware
                    catch (ex) {
                        return Promise.reject(ex)
                    }
            }
            // no more handlers
            else
                return Promise.resolve(callback())

            function next(err) {
                // user passed in an error, break this chain
                // and go to the error handler
                if (err) {
                    const result = Promise.reject(err)
                    result.catch(err => router.onerror(ctx, err))
                    return result
                }
                else
                    return dispatch(i + 1)
            }
        }
    },

    processParams: function processParams(params, ctx, req, res, opts, next) {
        const self = this
        return dispatch(0)

        function dispatch(i) {
            const param = self.params[ i ]

            ctx.next = req.next = res.next = nextParam

            // all params are processed, so execute handlers of this route
            if (!param)
                return self.dispatch(ctx, req, res, opts, next)
            else {
                const handler = param.handler,
                      value   = params[ param.index ]

                try {
                    let val

                    // plugin (stateful middleware)
                    if (handler.handle)
                        val = handler.handle(ctx, req, res, nextParam, value)
                    // middleware function
                    else
                        val = handler(ctx, nextParam, value)

                    return Promise.resolve(val)
                }
                // catch errors in middleware
                catch (ex) {
                    return Promise.reject(ex)
                }
            }

            function nextParam(err) {
                // user passed an error, break this chain and go to the error handler
                if (err)
                    return Promise.reject(err)
                else
                    return dispatch(i + 1)
            }
        }
    },

    addHandler: function addHandler(handler) {
        assert(
            handler && (typeof handler === 'function' || typeof handler.handle === 'function'),
            'request listener must be a function or an object with a `handle()` method'
        )

        this.handlers.push(handler)
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
