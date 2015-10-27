/**
 * Created by schwarzkopfb on 15/9/12.
 */

var methods        = require('methods'),
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

                req.router = res.router = self

                next()
            })
        }
    },

    handle: {
        enumerable: true,

        value: function handle(req, res, fn, index) {
            // probably called from an Express app and used as an error handler,
            // so the signature is: `router.handle(err, req, res, next)`
            // delegate to the error handler
            if(index instanceof Function)
                return this.uncaughtError.call(fn, req, res, fn)

            var self   = this,
                routes = this.routes,
                method = lowerCase(req.method),
                options,
                match

            if(method === 'options')
                options = []

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
                    if(options) {
                        if(route.method!== '*' && !~options.indexOf(route.method))
                            options.push(route.method)
                    }
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
                            this.processParams(route, match, params, req, res, fn, i)
                        // let's start the middleware chain for this route
                        else
                            this.chain(route, params, req, res, fn, i)

                        return
                    }
                }
            }

            // send options response and stop routing this request
            if(options) {
                var body = options.map(upperCase).join(',')

                res.writeHead(200, {
                    'Allow': body,
                    'Content-Length': Buffer.byteLength(body)
                })
                res.end(body)
            }
            // no matching route found. is there a `next()` fn?
            else if(fn instanceof Function)
                fn()
            // it's all over, send 404
            else
                this.notFound.call(res, req, res)
        }
    },

    processParams: {
        value: function (route, match, params, req, res, fn, index) {
            var self = this,
                i    = 0

            nextParam()

            function next(err, code, message) {
                if (err)
                    error(err, req, res, code, message)
                else
                    nextParam()
            }

            function nextParam() {
                var param = route.params[ i++ ]

                if (!param)
                    self.chain(route, params, req, res, fn, index)
                else
                    param.handler(req, res, next, match[ param.index + 1 ]) // index + 1 because first item of `match` is the whole route (you know, `regexp.match()`...)
            }
        }
    },

    chain: {
        value: function chain(route, params, req, res, fn, index) {
            var self     = this,
                handlers = route.handlers,
                i        = 0

            // reference `next()` from `req` and `res`
            req.next = res.next = next

            // start chain
            next()

            function next(err, code, message) {
                var handler = handlers[ i++ ]

                // an error occurred, it's time to stop routing this request
                // and call the error handler
                if(err)
                    error(err, req, res, code, message)
                // somebody called `next()` after `res.end()` by mistake
                // ignore it, warn the user and stop routing this request
                else if(res.finished) {
                    console.warn('`next()` called after the response has been sent')
                    console.trace()
                }
                // try to call the next handler function
                else if(handler)
                    try {
                        handler.call(res, req, res, next)
                    }
                    catch (ex) {
                        error(ex, req, res)
                    }
                // continue with the next route
                else if(++index < self.routes.length)
                    self.handle(req, res, fn, index)
                // no more routes. is there a `next()` fn?
                else if(fn instanceof Function)
                    fn()
                // it's all over, send 404
                else
                    self.notFound.call(res, req, res)
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
                var param = keys[ i ].name

                if (param && param in this.params)
                    params.push({
                        index: i,
                        handler: this.params[ param ]
                    })
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
                args.unshift(function (req, res, next) {
                    req.mounted = true
                    req.url     = req.url.replace(remove, '')

                    // clear cached req.path
                    delete req._path

                    next()
                })
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

function error(err, req, res, code, message) {
    if(!(err instanceof Error))
        err = Error(err)

    if(!res.finished) {
        if(arguments.length > 3)
            res.status(code, message)

        req.router.uncaughtError.call(res, err, req, res)
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

        return req.router.uncaughtError.apply(null, arguments)
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
    this.status(404).send('Cannot ' + req.method + ' ' + req.originalUrl)
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
