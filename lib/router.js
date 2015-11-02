/**
 * Created by schwarzkopfb on 15/9/12.
 */

var co             = require('co'),
    methods        = require('methods'),
    Context        = require('./context'),
    call           = Function.prototype.call,
    slice          = Array.prototype.slice,
    hasOwnProperty = Object.prototype.hasOwnProperty,
    pathRegexp     = require('path-to-regexp'),
    version        = require('../package.json').version,
    production     = process.env.NODE_ENV === 'production'

// constructor

function Router() {
    if(!(this instanceof Router))
        return new Router

    var router = function (req, res, next) {
        router.handle(req, res, next)
    }

    router.prototype = router.__proto__ = Router.prototype

    router.init()

    return router
}

// instance members

Object.defineProperties(Router.prototype, {
    routes: {
        writable: true,
        value: null
    },

    params: {
        writable: true,
        value: null
    },

    uncaughtError: {
        writable: true,
        value: handleError
    },

    init: {
        enumerable: true,

        value: function init() {
            var self = this

            this.routes = []
            this.params = {}

            this.route('*', '*', function (req, res, next) {
                res.set('x-powered-by', 'Ellipse/' + version)

                req.originalUrl = req.originalUrl || req.url
                req.res  = res
                res.req  = req

                req.app    = res.app    = self.app
                req.router = res.router = self

                next()
            })
        }
    },

    handle: {
        enumerable: true,

        value: function handle(ctx, req, res, fn, index) {
            // called from vanilla http server
            if(arguments.length === 2) {
                res = req
                req = ctx
                ctx = null
            }
            // used as an Express-like middleware
            else if(arguments.length === 3) {
                fn  = res
                res = req
                req = ctx
                ctx = null
            }

            var routes  = this.routes,
                method  = lowerCase(req.method),
                options = req._options,
                match

            if(!ctx)
                ctx = new Context(req, res)

            if(!req._options && method === 'options')
                options = req._options = []

            // check `req.path` against our routes
            for(var i = index || 0, l = routes.length; i < l; i++) {
                var route = routes[ i ]

                if(
                    (
                     options ||
                     method === 'head' ||
                     route.method === '*' ||
                     route.method === method
                    ) &&
                    (match = route.regexp.exec(req.path))
                ) {
                    if(options)
                        this.chain(route, null, ctx, req, res, fn, i)
                    else {
                        var params = req.params = {},
                            keys   = route.keys

                        // collect `req.params` from the match
                        if(keys.length)
                            for (var j = 1; j < match.length; j++) {
                                var key  = keys[ j - 1 ],
                                    prop = key.name,
                                    val  = decodeParam(match[ j ])

                                if (val !== undefined || !(hasOwnProperty.call(params, prop)))
                                    params[prop] = val
                            }

                        // there are params to process first
                        if(route.params.length)
                            this.processParams(route, match, params, ctx, req, res, fn, i)
                        // let's start the middleware chain for this route
                        else
                            this.chain(route, params, ctx, req, res, fn, i)
                    }

                    return
                }
            }

            // no matching route found. is there a `next()` fn?
            if(fn instanceof Function)
                fn()
            // send options response and stop routing this request
            else if(options)
                handleOptions(options, res)
            // it's all over, send 404
            else
                call.call(this.notFound, ctx, req, res)
        }
    },

    processParams: {
        value: function (route, match, params, ctx, req, res, fn, index) {
            var self = this,
                i    = 0

            nextParam()

            function next(err, code, message) {
                // not really an error, just a `yield next`. we've got a callback function,
                // save it for upstream dispatch and continue processing params
                if(err instanceof Function) {
                    ctx._callbacks.push(err)
                    err = null
                }

                if (err)
                    error(err, ctx, req, res, code, message)
                else
                    nextParam()
            }

            function nextParam() {
                var param = route.params[ i++ ]

                if (!param)
                    self.chain(route, params, ctx, req, res, fn, index)
                else
                    // index + 1 because first item of `match` is the whole route (you know, `regexp.match()`...)
                    call.call(param.handler, ctx, req, res, next, match[ param.index + 1 ])
            }
        }
    },

    chain: {
        value: function chain(route, params, ctx, req, res, fn, index) {
            var self     = this,
                handlers = route.handlers,
                options  = req._options,
                i        = 0

            // reference `next()` from `req` and `res`
            req.next = res.next = next

            if(options && route.method !== '*' && !~options.indexOf(route.method))
                options.push(route.method)

            // start chain
            next()

            function next(err, code, message) {
                var handler = handlers[ i++ ],
                    caller  = arguments.callee.caller

                // `next()` instead of `yield next` from a generator
                // it should mess up the order of upstream dispatch, so avoid direct calls
                if(caller && isGeneratorFunction(caller)) {
                    err  = Error('Calling `next()` directly from a generator function is not allowed. Use `yield next` instead.')
                    code = message = null
                }

                // not really an error, just a `yield next`. we've got a callback function,
                // save it for upstream dispatch and continue routing this request
                if(err instanceof Function) {
                    ctx._callbacks.push(err)
                    err = null
                }

                // an error occurred, it's time to stop routing this request
                // and call the error handler
                if(err)
                    error(err, ctx, req, res, code, message)
                // somebody called `next()` after `res.end()` by mistake
                // ignore it, warn the user and stop routing this request
                else if(res.finished) {
                    console.warn('`next()` called after the response has been sent')
                    console.trace()
                }
                // try to call the next handler function
                else if(handler) {
                    if(!options || handler instanceof Router || handler.prepareForRouter)
                        try {
                            call.call(handler, ctx, req, res, next)
                        }
                        catch (ex) {
                            error(ex, ctx, req, res)
                        }
                    else
                        next()
                }
                // continue with the next route
                else if(++index < self.routes.length)
                    self.handle(ctx, req, res, fn, index)
                // no more routes. is there a `next()` fn?
                else if(fn instanceof Function)
                    fn()
                else if(options)
                    handleOptions(options, res)
                // it's all over, send 404
                else
                    call.call(self.notFound, ctx, req, res)
            }
        }
    },

    route: {
        enumerable: true,
        
        value: function route(method, path, handlers) {
            if(arguments.length > 3)
                handlers = slice.call(arguments, 2)
            else if(!Array.isArray(handlers))
                handlers = [ handlers ]

            var keys   = [],
                params = []

            this.routes.push({
                method:   method,
                keys:     keys,
                params:   params,
                regexp:   pathRegexp(path, keys),
                handlers: handlers
            })

            // store param processor middlewares of this route
            for(var i = 0, l = keys.length; i < l; i++) {
                var param   = keys[ i ].name,
                    handler = this.params[ param ]

                if (param && param in this.params) {
                    if(isGeneratorFunction(handler))
                        handler = wrapGenerator(handler)

                    params.push({
                        index: i,
                        handler: handler
                    })
                }
            }

            // wrap generator functions
            for(i = 0, l = handlers.length; i < l; i++) {
                handler = handlers[ i ]

                if(isGeneratorFunction(handler))
                    handlers[ i ] = wrapGenerator(handler)
            }

            return this
        }
    },

    param: {
        enumerable: true,

        value: function param(name, callback) {
            this.params[ name ] = callback

            return this
        }
    },

    use: {
        enumerable: true,

        value: function use(path, handlers) {
            var self = this,
                args = slice.call(arguments)

            // strip first arg if it's a path
            if(typeof args[0] === 'string')
                args.splice(0, 1)

            // ensure wildcard
            if(typeof path !== 'string')
                path = '*'
            else if(path[ path.length - 1 ] !== '*')
                path += '*'

            // we have to mount if there is a sub-route
            if(path !== '/*' && path !== '*') {
                // remove trailing '*'
                var remove = path.substring(0, path.length - 1)

                // add mount middleware to the beginning of this sub-chain
                var middleware = function (req, res, next) {
                    req.mounted = true
                    req.url     = req.url.replace(remove, '')

                    // clear cached req.path
                    delete req._path
                    delete req._pathLength

                    next()
                }

                middleware.prepareForRouter = true

                args.unshift(middleware)
            }

            // register this router as the parent of its handlers
            // and reference router.app
            args.forEach(function (handler) {
                handler.parent = self

                if(self.app)
                    handler.app = self.app
            })

            // pass '*' as verb, `path` as path and all the handler functions to `router.route()`
            args.unshift('*', path)

            return this.route.apply(this, args)
        }
    },

    all: {
        enumerable: true,

        value: function all(path, handlers) {
            var args = slice.call(arguments)

            if(typeof args[0] === 'string')
                args.splice(0, 1)
            else
                path = '*'

            args.unshift('*', path)

            return this.route.apply(this, args)
        }
    },

    mount: {
        enumerable: true,
        
        value: function mount(mountPath) {
            var router = Router()

            this.use(mountPath, router)

            return router
        }
    },

    error: {
        enumerable: true,

        value: function error(handler) {
            this.uncaughtError = handler

            return this
        }
    },

    'catch': {
        enumerable: true,

        value: function () {
            return this.error.apply(this, arguments)
        }
    },

    notFound: {
        value: handleMissing
    }
})

// utils

function error(err, ctx, req, res, code, message) {
    if(!(err instanceof Error))
        err = Error(err)

    // save error to context. used to check state before upstream dispatching if generators are enabled
    ctx._error = err

    if(!res.finished) {
        if(arguments.length > 3)
            res.status(code, message)

        req.router.uncaughtError.call(ctx, err, req, res)
    }
    else
        console.error(err.stack || err)
}

function handleError(err, req, res) {
    // no custom error handler registered for this router
    // but there is a parent router, that probably has one
    // so delegate error to the parent
    if(req.router.parent && req.router.uncaughtError === handleError) {
        req.router = req.router.parent

        return req.router.uncaughtError.call(this, arguments)
    }

    console.error(err.stack || err)

    var body = 'Internal Server Error'

    if(!production)
        body += '\n\n' + (err.stack || err).toString()

    if(!res.statusCode || res.statusCode === 200)
        res.statusCode = 500

    res.status(err.status || err.statusCode || res.statusCode, res.statusMessage).send(body)
}

function handleMissing(req) {
    this.res.status(404).send('Cannot ' + req.method + ' ' + req.originalUrl)
}

function handleOptions(options, res) {
    var body = options.map(upperCase).join(','),
        head = { 'Content-Length': Buffer.byteLength(body) }

    if(options.length)
        head[ 'Allow' ] = body

    res.writeHead(200, head)
    res.end(body)
}

function decodeParam(val) {
    if (typeof val !== 'string' || val.length === 0)
        return val

    try {
        return decodeURIComponent(val)
    }
    catch (err) {
        if (err instanceof URIError) {
            err.message = 'Failed to decode param \'' + val + '\''
            err.status = err.statusCode = 400
        }

        throw err
    }
}

function lowerCase(string) {
    return string.toLowerCase()
}

function upperCase(string) {
    return string.toUpperCase()
}

// generator utils

function isGenerator(obj) {
    return obj.next instanceof Function && typeof obj.throw instanceof Function
}

function isGeneratorFunction(obj) {
    var constructor = obj.constructor

    if (!constructor)
        return false
    else if (constructor.name === 'GeneratorFunction' || constructor.displayName === 'GeneratorFunction')
        return true
    else
        return isGenerator(constructor.prototype)
}

function wrapGenerator(handler) {
    handler = co.wrap(handler)

    return function (req, res, next, param) {
        // execute middleware, handle errors and store the returned promise for upstream dispatch
        this._downstream.push(handler.call(this, next, param).catch(next))
    }
}

// Router.prototype.#VERB methods

methods.map(lowerCase).forEach(function (method) {
    Object.defineProperty(Router.prototype, method, {
        enumerable: true,

        value: function (path, handlers) {
            var args = slice.call(arguments)
            args.unshift(method)
            return this.route.apply(this, args)
        }
    })
})

// expose

module.exports = Router
