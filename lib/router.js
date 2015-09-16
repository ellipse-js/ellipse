/**
 * Created by schwarzkopfb on 15/9/12.
 */

var http           = require('http'),
    slice          = Array.prototype.slice,
    hasOwnProperty = Object.prototype.hasOwnProperty,
    merge          = require('merge-descriptors'),
    pathRegexp     = require('path-to-regexp'),
    production     = process.env.NODE_ENV === 'production'

// decorate http.ServerResponse instances with some handy utility methods

require('./response')

// constructor

function Router() {
    if(!(this instanceof Router))
        return new Router

    var router = function (req, res, next) {
        router.handle(req, res, next)
    }

    merge(router, Router.prototype)

    router.init()

    return router
}

// instance members

Object.defineProperties(Router.prototype, {
    routes: {
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

            this.route('*', '*', function (req, res, next) {
                req.originalUrl = req.originalUrl || req.url
                req.res = res
                res.req = req

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

            var routes = this.routes,
                method = lowerCase(req.method),
                match

            // check `req.path` against our routes
            for(var i = index || 0, l = routes.length; i < l; i++) {
                var route = routes[ i ]

                if(
                    (
                     route.method === '*' ||
                     route.method === method
                    ) &&
                    (match = route.regexp.exec(req.path))
                )
                    return this.chain(route, match, req, res, fn, i)
            }

            // no matching route found. is there a `next()` fn?
            if(fn instanceof Function)
                fn()
            // it's all over, send 404
            else
                this.notFound.call(res, req, res)
        }
    },

    chain: {
        value: function chain(route, match, req, res, fn, i) {
            var self     = this,
                handlers = route.handlers,
                keys     = route.keys,
                params   = req.params = {}

            // reference `next()` from `req` and `res`
            req.next = res.next = next

            // collect `req.params` from the match
            if(keys.length)
                for (var j = 1; j < match.length; j++) {
                    var key  = keys[ j - 1 ],
                        prop = key.name,
                        val  = decodeParam(match[ j ])

                    if (val !== undefined || !(hasOwnProperty.call(params, prop)))
                        params[prop] = val
                }

            // re-use iteration counter
            j = 0

            // start chain
            next()

            function next(err, code, message) {
                var handler = handlers[ j++ ]

                // an error occurred, it's time to stop routing this request
                // and call the error handler
                if(err)
                    error(err, req, res, code, message)
                // somebody called `next()` after `res.end()` by mistake
                // ignore it and stop routing this request
                else if(res.finished)
                    return
                // try to call the next handler function
                else if(handler)
                    try {
                        handler.call(res, req, res, next)
                    }
                    catch (ex) {
                        error(ex, req, res)
                    }
                // continue with the next route
                else if(++i < self.routes.length)
                    self.handle(req, res, fn, i)
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

            var keys = []

            this.routes.push({
                method:   method,
                //path:     path,
                keys:     keys,
                regexp:   pathRegexp(path, keys),
                handlers: handlers
            })

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
        }
    },

    'catch': {
        enumerable: true,

        value: function () {
            this.error.apply(this, arguments)
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

// Router.prototype.VERB methods

http.METHODS.map(lowerCase).forEach(function (method) {
    Object.defineProperty(Router.prototype, method, {
        enumerable: true,

        value: function (path, handlers) {
            var args = slice.call(arguments)
            args.unshift(method)
            this.route.apply(this, args)
        }
    })
})

// expose

module.exports = Router
