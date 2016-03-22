/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var Emitter       = require('events'),
    assert        = require('assert'),
    inherits      = require('util').inherits,
    methods       = require('methods'),
    Cookies       = require('cookies'),
    Route         = require('./route'),
    RouteDelegate = require('./delegate'),
    Context       = require('../context'),
    wrap          = require('../utils/wrap'),
    isGenFunc     = require('../utils/isGeneratorFunction'),
    handleError   = require('../utils/handlers/error'),
    handleOptions = require('../utils/handlers/options'),
    handleMissing = require('../utils/handlers/missing'),
    version       = require('../../package.json').version,
    slice         = Array.prototype.slice

// constructor

function Router() {
    var router = function (req, res, next) {
        router.handle.apply(router, arguments)
    }

    router.__proto__ = Router.prototype
    router._isRouter = true

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

    callback: {
        value: function callback() {
            return this.handle.bind(this)
        }
    },

    handle: {
        value: function handle(ctx, req, res, next) {
            // check arguments

            switch (arguments.length) {
                // vanilla http(s) server
                case 2:
                    res = req
                    req = ctx
                    ctx = next = null
                    break

                // classic middleware: `(req, res, next)`
                case 3:
                    next = res
                    res  = req
                    req  = ctx
                    ctx  = null
                    break

                // Connect/Express error handler: `(err, req, res, next)`
                case 4:
                    if(ctx instanceof Error)
                        return next(ctx)
            }

            // prepare request

            var app = this.app

            ctx = ctx || req.ctx

            if(!ctx)
                ctx = new Context(req, res)

            if(app) {
                ctx.__proto__ = app.context
                req.__proto__ = app.request
                res.__proto__ = app.response
            }

            req.app         = res.app =
            req.application = res.application = app

            req.router      = res.router = this
            req.originalUrl = req.originalUrl || req.url

            res.set('x-powered-by', 'Ellipse/' + version)

            // initialize cookies
            // we can make it here, since instantiation of `Cookies` is cheap
            if(!req.cookies)
                req.cookies = res.cookies = new Cookies(app.keys)

            // start routing
            this.dispatch(ctx, req, res, next)
        }
    },

    dispatch: {
        value: function dispatch(ctx, req, res, next) {
            var routes = this.routes,
                method = lowerCase(req.method),
                i      = 0

            if(method === 'options') {
                if(req._options)
                    var options = req._options
                else
                    options = req._options = []
            }

            nextRoute()

            function nextRoute() {
                var route = routes[ i++ ]

                if(route)
                    route.handle(ctx, req, res, options, nextRoute)
                // no matching route found. is there a `next()` fn?
                else if(next instanceof Function)
                    next()
                // send options response if needed
                else if(options)
                    handleOptions(options, res)
                // it's all over, send 404
                else
                    handleMissing(req, res)
            }
        }
    },

    route: {
        value: function route(path) {
            return new RouteDelegate(this, path)
        }
    },

    addRoute: {
        value: function addRoute(method, path, handlers) {
            assert.equal(typeof method, 'string', 'http verb must be a string.')
            assert.equal(typeof path, 'string', 'route path must be a string.')

            if(arguments.length > 3)
                handlers = slice.call(arguments, 2)
            else if(!Array.isArray(handlers))
                handlers = [ handlers ]

            // validate handlers
            handlers.forEach(function (handler) {
                assert(
                    handler instanceof Function ||
                    handler instanceof Router,
                    'request handler must be a function or a `Router` instance.'
                )
            })

            // merge with last added route if possible to improve performance
            // in addition to other cases, we save on repeated `app.all(mw)` and `app.use(mw)` calls
            if(
                this._last &&
                this._last.path   == path &&
                this._last.method == method
            ) {
                var lastRoute = this._last

                handlers.forEach(function (handler) {
                    if(isGenFunc(handler))
                        handler = wrap.generatorMiddleware(handler)
                    else
                        handler = wrap.middleware(handler)

                    lastRoute.handlers.push(handler)
                })
            }
            // register new route
            else
                this.routes.push(
                    this._last = new Route(this, method, path, handlers)
                )

            return this
        }
    },

    param: {
        value: function param(name, callback) {
            assert.equal(typeof name, 'string', 'parameter name must be a string.')
            assert(callback instanceof Function, 'parameter processor must be a function.')

            if(isGenFunc(callback))
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

                // ensure wildcard: last char must be an asterisk
                if(path[ path.length - 1 ] !== '*')
                    path += '*'
            }
            // no path provided, any route should match
            else
                path = '*'

            // we have to mount if there is a sub-route
            if(path !== '/*' && path !== '*') {
                // remove trailing '*'
                var remove = path.length - 1

                // add mount middleware to the beginning of this sub-chain
                var middleware = function (ctx, req, res, next) {
                    req.mounted = true
                    req.url     = req.url.substring(remove)

                    // clear cached req.path
                    delete req._path
                    delete req._pathLength

                    next()
                }

                middleware._prepareForUse = true

                args.unshift(middleware)
            }

            // register this router as the parent of its handlers and
            // reference router.app as well
            args.forEach(function (handler) {
                handler.parent = self

                if(!handler.app)
                    handler.app = self.app
            })

            // pass '*' as verb, `path` as path and all the handler functions to `router.route()`
            args.unshift('*', path)

            return this.addRoute.apply(this, args)
        }
    },

    all: {
        value: function all(path, handlers) {
            var args = slice.call(arguments)

            if(typeof path === 'string')
                args.splice(0, 1)
            else
                path = '*'

            // all verbs and given path
            args.unshift('*', path)

            return this.addRoute.apply(this, args)
        }
    },

    mount: {
        value: function mount(mountPath) {
            assert.equal(typeof mountPath, 'string', 'Mount path must be a string.')

            var router = new Router()

            this.use(mountPath, router)

            return router
        }
    },

    error: {
        value: function error(handler) {
            assert(handler instanceof Function, 'Error handler must be a function.')

            // handler accepts three arguments, so
            // pass `(err, req, res)` instead of `(err, ctx)`
            if(handler.length === 3) {
                var original = handler

                handler = function (err, ctx, req, res) {
                    original(err, req, res)
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

    // alias `.delete()` as `.del()`
    del: {
        value: function del(path, handlers) {
            return this.delete.apply(this, arguments)
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

// Router.prototype.#VERB methods

function lowerCase(string) {
    return string.toLowerCase()
}

methods.map(lowerCase).forEach(function (method) {
    Object.defineProperty(Router.prototype, method, {
        value: function (path, handlers) {
            var args = slice.call(arguments)
            args.unshift(method)
            return this.addRoute.apply(this, args)
        }
    })
})

// expose

module.exports = Router
