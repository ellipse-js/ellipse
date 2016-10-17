'use strict'

// expose

module.exports = Router

// includes

const Emitter       = require('events'),
      assert        = require('assert'),
      methods       = require('methods'),
      httpError     = require('http-errors'),
      Route         = require('./route'),
      Mount         = require('./mount'),
      RouteDelegate = require('./delegate'),
      Context       = require('../context'),
      wrap          = require('../utils/wrap'),
      verbs         = require('../utils/verbs'),
      extend        = require('../utils/extend'),
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

    this._params = {}
    this._routes = {}
    this._stack  = []
    this._head   = []
    this._last   = null
}

// instance members

Router.prototype = {
    get parent() {
        return this._parent
    },

    get app() {
        if (this._parent)
            return this._parent.app
    },

    get application() {
        return this.app
    },

    get params() {
        return this._params
    },

    get routes() {
        return this._routes
    },

    get stack() {
        return this._stack
    },

    get length() {
        return this._stack.length
    },

    callback: function callback() {
        return this.handle.bind(this, null)
    },

    handle: function handle(ctx, req, res, next) {
        const app = this.app

        ctx = ctx || req._ctx

        if (!ctx)
            // note: constructor sets `req._ctx`
            ctx = new Context(req, res)

        if (app) {
            if (app._xpb)
                res.set('x-powered-by', app._xpb)

            Object.setPrototypeOf(ctx, app.context)
            Object.setPrototypeOf(req, app.request)
            Object.setPrototypeOf(res, app.response)
        }

        req.app = res.app =
        req.application = res.application = app

        req.router = res.router = this
        req.originalUrl = req.originalUrl || req.url

        // start routing
        const chain = this.dispatch(ctx, req, res, next)

        if (chain) {
            const onerror    = this.onerror.bind(this, ctx),
                  onfinished = this.onfinished.bind(this, ctx)

            chain.then(onfinished).catch(onerror)
        }

        return chain
    },

    dispatch: function dispatch(ctx, req, res, next) {
        const router = this,
              routes = this._stack,
              method = req.method.toLowerCase()

        if (method === 'options') {
            if (req._options)
                var options = req._options
            else
                options = req._options = []
        }

        return dispatch(0)

        function dispatch(i) {
            const route = routes[ i ]

            if (route)
                return route.handle(ctx, req, res, options, nextRoute)
            // no matching route found. is there a `next()` fn?
            else if (typeof next === 'function')
                return Promise.resolve(next())
            // send options response if needed
            else if (options)
                handleOptions(options, res)
            // it's all over, emit related events and/or send 404
            // except if automatic response has been configured
            else {
                if (ctx.respond && ctx.body !== undefined) {
                    // ctx.send()
                    return Promise.resolve()
                }

                if (router.listenerCount('notFound'))
                    router.emit('notFound', ctx)
                else
                    handleMissing(ctx)
            }

            function nextRoute() {
                return dispatch(i + 1)
            }
        }
    },

    route: function route(path) {
        return new RouteDelegate(this, path)
    },

    addRoute: function addRoute(method, path, handlers) {
        assert.equal(typeof method, 'string', '`method` must be string')
        assert(path instanceof RegExp || typeof path === 'string', '`path` must be string')

        method = method.toLowerCase()

        if (arguments.length > 3)
            handlers = slice.call(arguments, 2)
        else if (!Array.isArray(handlers))
            handlers = [ handlers ]

        // register this router as the parent of its given handlers
        handlers.forEach(handler => handler._parent = this)

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
            this._stack.push(
                this._last = new Route(this, method, path, handlers)
            )

        if (!this._routes[ method ])
            this._routes[ method ] = []

        this._routes[ method ].push(path)

        if (method === 'head')
            this._head.push(this._last.regexp)

        return this
    },

    param: function param(name, callback) {
        assert.equal(typeof name, 'string', 'parameter name must be a string')
        assert.equal(typeof callback, 'function', 'parameter processor must be a function')

        this.params[ name ] = callback

        return this
    },

    use: function use(path, handlers) {
        const args = slice.call(arguments)

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

        // pass '*' as verb, `path` as path and all the handlers to `router.addRoute()`
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
        this.use(mountPath, router)
        return router
    },

    onerror: function onerror(ctx, err) {
        err = httpError(err)
        handleError(err, ctx)
    },

    onfinished: function onfinished(ctx) {
        if (ctx.respond && ctx.body !== undefined && !ctx.headersSent && !ctx.finished)
            ctx.send()
    },

    /**
     * Returns `true` if this router has an expliceit head
     * handler for the given path, `false` otherwise.
     *
     * @param {string} path Path to check against.
     */
    _matchHead: function matchHead(path) {
        const head   = this._head,
              length = head.length

        for (var i = 0; i < length; i++)
            if (head[ i ].test(path))
                return true

        return false
    },

    toJSON: function toJSON() {
        return {
            params: Object.keys(this.params),
            routes: extend({}, this._routes)
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
