'use strict'

// expose

module.exports = Router

// includes

const Emitter       = require('events'),
      assert        = require('assert'),
      methods       = require('methods'),
      Route         = require('./route'),
      Mount         = require('./mount'),
      RouteDelegate = require('./delegate'),
      Context       = require('../context'),
      wrap          = require('../utils/wrap'),
      verbs         = require('../utils/verbs'),
      isGenFunc     = require('../utils/isGenerator').isFunction,
      handleError   = require('./handlers/error'),
      handleOptions = require('./handlers/options'),
      handleMissing = require('./handlers/missing'),
      slice         = Array.prototype.slice

// constructor

function Router() {
    if (!(this instanceof Router))
        return new Router

    Emitter.call(this)

    // lookup of HEAD handlers
    this._head = []
}

// utils

function noop() {}

// instance members

Router.prototype = {
    _last:       null,
    handleError: handleError,

    get params() {
        return this._params || (this._params = {})
    },

    get routes() {
        return this._routes || (this._routes = [])
    },

    callback: function callback() {
        return this.handle.bind(this)
    },

    handle: function handle(ctx, req, res, next) {
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
                if (ctx instanceof Error)
                    return next(ctx)
        }

        // prepare request

        var app = this.app

        ctx = ctx || req._ctx

        if (!ctx)
            ctx = new Context(app, req, res) // note: constructor sets `req._ctx`

        if (app) {
            Object.setPrototypeOf(ctx, app.context)
            Object.setPrototypeOf(req, app.request)
            Object.setPrototypeOf(res, app.response)
        }

        req.app = res.app =
        req.application = res.application = app

        req.router = res.router = this
        req.originalUrl = req.originalUrl || req.url

        // start routing
        this.dispatch(ctx, req, res, next)
    },

    dispatch: function dispatch(ctx, req, res, next) {
        const app    = this.app,
              router = this,
              routes = this.routes,
              method = req.method.toLowerCase()

        var i = 0

        if (method === 'options') {
            if (req._options)
                var options = req._options
            else
                options = req._options = []
        }

        nextRoute()

        function nextRoute() {
            const done  = ctx.callback,
                  route = routes[ i++ ]

            const p = app._toPromise(resolve => {
                ctx.callback = resolve

                if (route)
                    route.handle(ctx, req, res, options, nextRoute)
                // no matching route found. is there a `next()` fn?
                else if (typeof next === 'function')
                    setImmediate(next)
                // send options response if needed
                else if (options)
                    handleOptions(options, res)
                // it's all over, emit related events and/or send 404
                // except if automatic response has been configured
                else {
                    if (
                        ctx.respond &&
                        ctx.body !== undefined
                    )
                        return ctx.send()

                    if (router.listenerCount('notFound'))
                        router.emit('notFound', ctx, req, res)
                    else
                        handleMissing(ctx)
                }
            })

            if (p)
                p.then(done, noop)

            return p
        }
    },

    route: function route(path) {
        return new RouteDelegate(this, path)
    },

    addRoute: function addRoute(method, path, handlers) {
        assert.equal(typeof method, 'string', '`method` must be string')
        assert(
            path instanceof RegExp ||
            typeof path === 'string',
            '`path` must be string'
        )

        method = method.toLowerCase()

        if (arguments.length > 3)
            handlers = slice.call(arguments, 2)
        else if (!Array.isArray(handlers))
            handlers = [ handlers ]

        // merge with last added route if possible to improve performance
        // in addition to other cases, we save on repeated `app.all(mw)` and `app.use(mw)` calls
        if (
            this._last &&
            this._last.path == path &&
            this._last.method == method
        )
            for (var i = 0, l = handlers.length; i < l; i++)
                this._last.addHandler(handlers[ i ])
        // register new route
        else
            this.routes.push(
                this._last = new Route(this, method, path, handlers)
            )

        // store route match regexp to be able
        // to rewrite HEAD to GET when needed
        if (method === 'head')
            this._head.push(this._last.regexp)

        return this
    },

    param: function param(name, callback) {
        assert.equal(typeof name, 'string', 'parameter name must be a string')
        assert(callback instanceof Function, 'parameter processor must be a function')

        if (!isGenFunc(callback))
            callback = wrap.paramProcessor(callback)

        this.params[ name ] = callback

        return this
    },

    use: function use(path, handlers) {
        const self = this,
              args = slice.call(arguments)

        // strip first arg if it's a path
        if (typeof path === 'string') {
            args.splice(0, 1)

            // ensure wildcard: last char must be an asterisk
            if (path[ path.length - 1 ] !== '*')
                path += '*'
        }
        // no path provided, any route should match
        else
            path = '*'

        // we have to mount if there is a sub-route
        if (path !== '/*' && path !== '*') {
            // index of trailing '*'
            const index = path.length - 1
            // add mount point to the beginning of this sub-chain
            args.unshift(new Mount(index))
            // notify listeners about the new mount point
            this.emit('mount', path.substring(0, index))
        }

        // register this router as the parent of its handlers and
        // reference router.app as well
        args.forEach(handler => {
            handler.parent = self

            if (!handler.app)
                handler.app = self.app
        })

        // pass '*' as verb, `path` as path and all the handler functions to `router.route()`
        args.unshift('*', path)

        return this.addRoute.apply(this, args)
    },

    all: function all(path, handlers) {
        const args = slice.call(arguments)

        if (typeof path === 'string')
            args.splice(0, 1)
        else
            path = '*'

        // all verbs and given path
        args.unshift('*', path)

        return this.addRoute.apply(this, args)
    },

    mount: function mount(mountPath) {
        assert.equal(typeof mountPath, 'string', 'mount path must be a string')

        const router = new Router

        router.app =
        router.router =
        router.application = this.app

        this.use(mountPath, router)

        return router
    },

    removeHandler: function (handler) {
        const routes = this.routes

        for (var i = 0, l = routes.length; i < l; i++)
            if (routes[ i ].removeHandler(handler))
                return true

        return false
    },

    error: function error(handler) {
        assert(handler instanceof Function, 'error handler must be a function')

        // handler accepts three arguments, so
        // pass `(err, req, res)` instead of `(err, ctx)`
        if (handler.length === 3) {
            const original = handler

            handler = (err, ctx, req, res) => {
                original(err, req, res)
            }
        }

        return this.on('error', handler)
    },

    'catch': function () {
        return this.error.apply(this, arguments)
    },

    _matchHead: function matchHead(path) {
        const head   = this._head,
              length = head.length

        for (var i = 0; i < length; i++)
            if (head[ i ].test(path))
                return true
    },

    toJSON: function toJSON() {
        return {
            params: Object.keys(this.params),
            routes: this.routes.reduce((output, route, i) => {
                if (!i) return output // skip init middleware

                if (!(route.method in output))
                    output[ route.method ] = []

                output[ route.method ].push(route.path)

                return output
            }, {})
        }
    },

    inspect: function inspect() {
        return this.toJSON()
    }
}

// verb method aliases

verbs(Router, verb => function (path, handlers) {
    const args = slice.call(arguments)
    args.unshift(verb)
    return this.addRoute.apply(this, args)
})

// inherit

Object.setPrototypeOf(Router.prototype, Emitter.prototype)
