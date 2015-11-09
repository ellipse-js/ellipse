/**
 * Created by schwarzkopfb on 15/9/12.
 */

var Emitter             = require('events'),
    assert              = require('assert'),
    inherits            = require('util').inherits,
    merge               = require('merge-descriptors'),
    methods             = require('methods'),
    Cookies             = require('cookies'),
    slice               = Array.prototype.slice,
    push                = Array.prototype.push,
    Context             = require('../context'),
    Route               = require('./route'),
    wrap                = require('./wrap'),
    utils               = require('../utils'),
    handleError         = utils.handleError,
    handleOptions       = utils.handleOptions,
    handleMissing       = utils.handleMissing,
    isGeneratorFunction = utils.isGeneratorFunction,
    version             = require('../../package.json').version

// constructor

function Router() {
    var router = function (req, res, next) {
        router.handle.call(router, null, req, res, next)
    }

    router.__proto__ = Router.prototype

    Emitter.call(router)

    router.init()

    return router
}

inherits(Router, Emitter)

// instance members

Object.defineProperties(Router.prototype, {
    _last: {
        writable: true,
        value: null
    },

    routes: {
        writable: true,
        value: null
    },

    params: {
        writable: true,
        value: null
    },

    handleError: {
        value: handleError
    },

    init: {
        value: function init() {
            this.routes = []
            this.params = {}
        }
    },

    handle: {
        value: function handle(ctx, req, res, next) {
            // called from vanilla http(s) server
            if(arguments.length === 2) {
                res = req
                req = ctx
                ctx = next = null
            }

            // prepare request

            var app = this.app

            ctx = ctx || req.ctx

            if(!ctx)
                ctx = new Context(app, req, res, this.hasGenerator)

            // merge is expensive, so only do if necessary
            if(app && app._extended === undefined) {
                if (app._ctxExtended === undefined)
                    app._ctxExtended = isExtended(app.context)

                if (app._reqExtended === undefined)
                    app._reqExtended = isExtended(app.request)

                if (app._resExtended === undefined)
                    app._resExtended = isExtended(app.response)

                app._extended = (
                    app._ctxExtended ||
                    app._reqExtended ||
                    app._resExtended
                )
            }

            if(app._reqExtended)
                merge(req, app.request, false)

            if(app._resExtended)
                merge(res, app.response, false)

            if(app._ctxExtended)
                merge(ctx, app.context, false)

            req.app         = res.app =
            req.application = res.application = app

            req.router      = res.router = this
            req.originalUrl = req.originalUrl || req.url

            res.set('x-powered-by', 'Ellipse/' + version)

            // initialize cookies
            if(!req.cookies)
                req.cookies = res.cookies = new Cookies(app.keys)

            // start routing
            this.dispatch(ctx, req, res, next)
        }
    },

    dispatch: {
        value: function dispatch(ctx, req, res, next) {
            var routes  = this.routes,
                method  = lowerCase(req.method),
                i = 0

            if(method === 'options')
                var options = []

            nextRoute()

            function nextRoute() {
                var route = routes[ i++ ]

                if(route)
                    route.handle(ctx, req, res, options, nextRoute)
                // no matching route found. is there a `next()` fn?
                else if(next instanceof Function)
                    next()
                // send options response and stop routing this request
                else if(options)
                    handleOptions(options, res)
                // it's all over, send 404
                else
                    handleMissing(req, res)
            }
        }
    },

    route: {
        value: function route(method, path, handlers) {
            if(arguments.length > 3)
                handlers = slice.call(arguments, 2)
            else if(!Array.isArray(handlers))
                handlers = [ handlers ]

            handlers.forEach(function (handler) {
                assert(
                    handler instanceof Function ||
                    handler instanceof Router,
                    'Request handler must be a function or a `Router` instance.'
                )
            })

            // merge with last added route if possible
            // to improve performance of routing
            // we save on repeated `app.use(fn)` calls for example
            if(
                this._last &&
                this._last.path   == path &&
                this._last.method == method
            ) {
                var lastHandelrs = this._last.handlers

                handlers.forEach(function (handler) {
                    if(isGeneratorFunction(handler))
                        handler = wrap.generatorMiddleware(handler)
                    else
                        handler = wrap.middleware(handler)

                    lastHandelrs.push(handler)
                })
            }
            // register new route
            else {
                var route = this._last = new Route(this, method, path, handlers)

                if(route.hasGenerator)
                    this.hasGenerator = true

                this.routes.push(route)
            }

            return this
        }
    },

    param: {
        value: function param(name, callback) {
            assert(typeof name === 'string', 'Parameter name must be a string.')
            assert(callback instanceof Function, 'Parameter processor must be a function.')

            if(isGeneratorFunction(callback))
                callback = wrap.generatorParamProcessor(callback)
            else
                callback = wrap.paramProcessor(callback)

            this.params[ name ] = callback

            return this
        }
    },

    use: {
        value: function use(path, handlers) {
            var self = this,
                args = slice.call(arguments)

            // strip first arg if it's a path
            if(typeof path === 'string') {
                args.splice(0, 1)

                // ensure wildcard
                if(path[ path.length - 1 ] !== '*')
                    path += '*'
            }
            else
                path = '*'

            // we have to mount if there is a sub-route
            if(path !== '/*' && path !== '*') {
                // remove trailing '*'
                var remove = path.substring(0, path.length - 1)

                // add mount middleware to the beginning of this sub-chain
                var middleware = function (ctx, req, res, next) {
                    req.mounted = true
                    req.url     = req.url.replace(remove, '')

                    // clear cached req.path
                    delete req._path
                    delete req._pathLength

                    next()
                }

                middleware.prepareForUse = true

                args.unshift(middleware)
            }

            // register this router as the parent of its handlers
            // and reference router.app
            args.forEach(function (handler) {
                handler.parent = self

                if(!handler.app)
                    handler.app = self.app
            })

            // pass '*' as verb, `path` as path and all the handler functions to `router.route()`
            args.unshift('*', path)

            return this.route.apply(this, args)
        }
    },

    all: {
        value: function all(path, handlers) {
            var args = slice.call(arguments)

            if(typeof path === 'string')
                args.splice(0, 1)
            else
                path = '*'

            args.unshift('*', path)

            return this.route.apply(this, args)
        }
    },

    mount: {
        value: function mount(mountPath) {
            assert(typeof mountPath === 'string', 'Mount path must be a string.')

            var router = new Router()

            this.use(mountPath, router)

            return router
        }
    },

    error: {
        value: function error(handler) {
            assert(handler instanceof Function, 'Error handler must be a function.')

            // handler accepts three arguments, so
            // pass (err, req, res) instead of (err, ctx)
            if(handler.length === 3) {
                var _handler = handler

                handler = function (err, ctx, req, res) {
                    _handler(err, req, res)
                }
            }

            return this.on('error', handler)
        }
    },

    'catch': {
        value: function () {
            return this.error.apply(this, arguments)
        }
    },

    toJSON: {
        value: function toJSON() {
            return {
                params: Object.keys(this.params),
                routes: this.routes.reduce(function (output, route, i) {
                    if(!i) return output // skip init middleware

                    if(!(route.method in output))
                        output[ route.method ] = []

                    output[ route.method ].push(route.path)

                    return output
                }, {})
            }
        }
    },

    inspect: {
        value: function inspect() {
            return this.toJSON()
        }
    }
})

// utils

function isExtended(proto) {
    return Object.keys(proto).length
}

function lowerCase(string) {
    return string.toLowerCase()
}

// Router.prototype.#VERB methods

methods.map(lowerCase).forEach(function (method) {
    Object.defineProperty(Router.prototype, method, {
        value: function (path, handlers) {
            var args = slice.call(arguments)
            args.unshift(method)
            return this.route.apply(this, args)
        }
    })
})

// expose

module.exports = Router