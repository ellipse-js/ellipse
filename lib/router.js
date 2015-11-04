/**
 * Created by schwarzkopfb on 15/9/12.
 */

var Emitter             = require('events'),
    inherits            = require('util').inherits,
    statusCodes         = require('http').STATUS_CODES,
    co                  = require('co'),
    merge               = require('merge-descriptors'),
    methods             = require('methods'),
    Context             = require('./context'),
    call                = Function.prototype.call,
    slice               = Array.prototype.slice,
    hasOwnProperty      = Object.prototype.hasOwnProperty,
    pathRegexp          = require('path-to-regexp'),
    version             = require('../package.json').version,
    isGeneratorFunction = require('./utils').isGeneratorFunction

// constructor

function Router() {
    if(!(this instanceof Router))
        return new Router

    var router = function (req, res, next) {
        router.handle(req, res, next)
    }

    router.__proto__ = Router.prototype

    Emitter.call(router)

    router.init()

    return router
}

inherits(Router, Emitter)

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

    handleError: {
        value: handleError
    },

    init: {
        enumerable: true,

        value: function init() {
            var self = this

            this.routes = []
            this.params = {}

            this.route('*', '*', function (req, res, next) {
                var app = self.app,
                    ctx = req.ctx

                if(!ctx)
                    createContext(app, req, res)

                merge(req, app.request)
                merge(res, app.response)
                merge(ctx, app.context)

                req.router      = res.router = self
                req.originalUrl = req.originalUrl || req.url

                res.set('x-powered-by', 'Ellipse/' + version)

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
                ctx = req.ctx || createContext(this.app, req, res)

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
                handleMissing(req, res)
        }
    },

    processParams: {
        value: function (route, match, params, ctx, req, res, fn, index) {
            var self = this,
                i    = 0

            nextParam()

            function next(err, code, message) {
                var caller = arguments.callee.caller

                // error: `next()` instead of `yield next` from a generator
                // it should mess up the order of upstream dispatch, so avoid direct calls
                if(caller && isGeneratorFunction(caller)) {
                    err  = new Error('Calling `next()` directly from a generator function is not supported. Use `yield next` instead.')
                    code = message = null
                }

                // not really an error, just a `yield next`. we've got a callback function,
                // save it for upstream dispatch and continue processing params
                if(err instanceof Function) {
                    ctx._callbacks.push(err)
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
                    nextParam()
            }

            function nextParam() {
                var param = route.params[ i++ ]

                if (!param)
                    self.chain(route, params, ctx, req, res, fn, index)
                else
                    // index + 1 because first item of `match` is the whole route (you know, `regexp.match()`...)
                    callParamProcessor(param.handler, ctx, req, res, next, match[ param.index + 1 ])
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

                // error: `next()` instead of `yield next` from a generator
                // it should mess up the order of upstream dispatch, so avoid direct calls
                if(caller && isGeneratorFunction(caller)) {
                    err  = new Error('Calling `next()` directly from a generator function is not supported. Use `yield next` instead.')
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
                if(err) {
                    if(code)
                        err.status  = code

                    if(message)
                        err.message = message

                    error(err, ctx, req, res)
                }
                // somebody called `next()` after `res.end()` by mistake
                // ignore it, warn the user and stop routing this request
                else if(res.finished) {
                    console.warn('`next()` called after the response has been sent')
                    console.trace()
                }
                // try to call the next handler function
                else if(handler) {
                    if(!options || handler instanceof Router || handler.prepareForUse)
                        try {
                            callHandler(handler, ctx, req, res, next)
                        }
                        catch (ex) {
                            console.log('EX', ex)
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
                    handleMissing(req, res)
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
                        handler = wrapGeneratorParamProcessor(handler)

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
                    handlers[ i ] = wrapGeneratorMiddleware(handler)
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
                var middleware = function (req, res, next) {
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
        enumerable: true,

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
        enumerable: true,

        value: function () {
            return this.error.apply(this, arguments)
        }
    }
})

// utils

function createContext(app, req, res) {
    var ctx = new Context(req, res)
    return merge(ctx, app.context)
}

function callHandler(handler, ctx, req, res, next) {
    var args = [ ctx ]

    switch (handler.length) {
        case 1:
            args = [ ctx, next ]
            break

        case 2:
            args = [ ctx, req, res, next ]
            break

        case 3:
            args = [ ctx, req, res, next ]
            break

        default:
            args = [ ctx, ctx, req, res, next ]
    }

    call.apply(handler, args)
}

function callParamProcessor(handler, ctx, req, res, next, param) {
    var args = [ ctx ]

    switch (handler.length) {
        case 1:
            args = [ ctx, param ]
            break

        case 2:
            args = [ ctx, next, param ]
            break

        case 3:
            args = [ ctx, ctx, next, param ]
            break

        case 4:
            args = [ ctx, req, res, next, param ]
            break

        default:
            args = [ ctx, ctx, req, res, next, param ]
    }

    call.apply(handler, args)
}

function error(err, ctx, req, res) {
    if(!(err instanceof Error))
        err = new Error(err)

    // save error to context. used to check state before upstream dispatching
    ctx._error = err

    var router    = ctx.router,
        listeners = router.listenerCount('error')

    if(!res.finished) {
        if(listeners)
            router.emit('error', err, ctx, req, res)
        else
            handleError(err, ctx, req, res)
    }
    else
        console.error(err.stack || err)
}

function handleError(err, ctx, req, res) {
    var router = ctx.router,
        stack  = (err.stack || err).toString(),
        env    = ctx.app.env

    // there is a parent router, that probably has a custom error handler registered
    // so delegate error to the parent
    if(router.parent) {
        req.router = res.router = router.parent

        return error(err, ctx, req, res)
    }

    ctx.type = 'text/plain'
    ctx.body = ctx.message = getErrorMessage(err)

    if(err.status || err.statusCode)
        ctx.code = err.status
    else if(!ctx.code || ctx.code === 200)
        ctx.code = 500

    var printable = ctx.code === 500 && stack

    if(env !== 'production' && env !== 'test' && printable)
        ctx.body += '\n\n' + stack

    ctx.respond()

    if(env !== 'test' && printable)
        console.error(stack)
}

function handleMissing(req, res) {
    res.status(404).send('Cannot ' + req.method + ' ' + req.originalUrl)
}

function handleOptions(options, res) {
    var body = options.map(upperCase).join(','),
        head = { 'Content-Length': Buffer.byteLength(body) }

    if(options.length)
        head[ 'Allow' ] = body

    res.writeHead(200, head)
    res.end(body)
}

function getErrorMessage(err) {
    var code = +(err.status || err.statusCode || err.statusMessage) || 500

    if(code !== 500 && code >= 400 && code < 600 && err.message)
        return err.message
    else
        return statusCodes[ code ]
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

function wrapGeneratorParamProcessor(handler) {
    var length = handler.length, fn

    handler = co.wrap(handler)

    // execute param processor, handle errors and store the returned promise for upstream dispatch
    switch (length) {
        case 0:
            fn = function () {
                this._downstream.push(handler.call(this).catch(this.next))
            }
            break

        case 1:
            fn = function (param) {
                this._downstream.push(handler.apply(this, arguments).catch(this.next))
            }
            break

        case 2:
            fn = function (next, param) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break

        case 3:
            fn = function (ctx, next, param) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break

        case 4:
            fn = function (req, res, next, param) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break

        default:
            fn = function (ctx, req, res, next, param) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break
    }

    return fn
}

function wrapGeneratorMiddleware(handler) {
    var length = handler.length, fn

    handler = co.wrap(handler)

    // execute middleware, handle errors and store the returned promise for upstream dispatch
    switch (length) {
        case 0:
            fn = function (next) {
                this._downstream.push(handler.call(this).catch(next))
            }
        break

        case 1:
            fn = function (next) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break

        case 2:
            fn = function (req, res) {
                this._downstream.push(handler.apply(this, [ this, this.next ]).catch(this.next))
            }
            break

        case 3:
            fn = function (req, res, next) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
            break

        default:
            fn = function (ctx, req, res, next) {
                this._downstream.push(handler.apply(this, arguments).catch(next))
            }
    }

    return fn
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
