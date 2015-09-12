/**
 * Created by schwarzkopfb on 15/9/12.
 */

var http           = require('http'),
    slice          = Array.prototype.slice,
    hasOwnProperty = Object.prototype.hasOwnProperty,
    pathRegexp     = require('path-to-regexp'),
    production     = process.env.NODE_ENV === 'production'

// decorate http.ServerResponse instances with some handy utility methods

require('./response')

// constructor

function Router() {
    if(!(this instanceof Router))
        return new Router
}

// instance members

Object.defineProperties(Router.prototype, {
    routes: {
        value: []
    },

    uncaughtError: {
        writable: true,
        value: handleError
    },

    handle: {
        enumerable: true,

        value: function (req, res, index) {
            var self   = this,
                routes = this.routes,
                method = req.method.toLowerCase(),
                url    = req.url,
                match

            if(!index) {
                req._originalUrl = url
                req.res          = res
                res.req          = req
            }

            for(var i = index || 0, l = routes.length; i < l; i++) {
                var route = routes[ i ]

                if((route.method === '*' || route.method === method) && (match = route.regexp.exec(req.path))) {
                    var handlers = route.handlers,
                        keys     = route.keys,
                        length   = handlers.length,
                        params   = req.params = {},
                        k        = 0

                    if(keys.length <= match.length)
                        for (var j = 1; j < match.length; j++) {
                            var key  = keys[ j - 1 ],
                                prop = key.name,
                                val  = decodeParam(match[ j ])

                            if (val !== undefined || !(hasOwnProperty.call(params, prop)))
                                params[prop] = val
                        }

                    req.next = res.next = next

                    next()

                    function next(err, code, message) {
                        var handler = handlers[ k++ ]

                        if(err) {
                            res.status(code, message)

                            if(!(err instanceof Error))
                                err = Error(err)

                            self.uncaughtError.call(res, err, req, res)
                        }
                        else if(k <= length)
                            try {
                                handler.call(res, req, res, next)
                            }
                            catch (ex) {
                                if(!(ex instanceof Error))
                                    ex = Error(ex)

                                self.uncaughtError.call(res, ex, req, res)
                            }
                        else if(++i < l)
                            self.handle(req, res, i)
                        else
                            self.notFound.call(res, req, res)
                    }

                    return
                }
            }

            this.notFound.call(res, req, res)
        }
    },

    route: {
        enumerable: true, 
        
        value: function (method, path, handlers) {
            if(arguments.length > 3)
                handlers = slice.call(arguments, 2)
            else
                handlers = [ handlers ]

            var keys = []

            this.routes.push({
                method:   method,
                path:     path,
                keys:     keys,
                regexp:   pathRegexp(path, keys),
                handlers: handlers
            })

            return this
        }
    },

    use: {
        enumerable: true,

        value: function (path, handlers) {
            var args = slice.call(arguments)

            if(typeof args[0] === 'string')
                args.splice(0, 1)
            else
                path = '*'

            args.unshift('*', path)

            return this.route.apply(this, args)
        }
    },

    all: {
        enumerable: true,

        value: function (path, handlers) {
            return this.use.apply(this, arguments)
        }
    },

    callback: {
        enumerable: true,

        get: function () {
            return this.handle.bind(this)
        }
    },

    error: {
        enumerable: true,

        value: function (handler) {
            this.uncaughtError = handler
        }
    },

    notFound: {
        value: handleMissing
    }
})

// utils

function handleError(err, req, res) {
    console.error(err.stack || err)

    var body = 'Internal Server Error'

    if(!production)
        body += '\n\n' + (err.stack || err).toString()

    if(!res.statusCode || res.statusCode === 200)
        res.statusCode = 500

    res.status(err.status || err.statusCode || res.statusCode, res.statusMessage).send(body)
}

function handleMissing(req) {
    this.status(404).send('Cannot ' + req.method + ' ' + req.url)
}

function decodeParam(val) {
    if (typeof val !== 'string' || val.length === 0) {
        return val;
    }

    try {
        return decodeURIComponent(val);
    } catch (err) {
        if (err instanceof URIError) {
            err.message = 'Failed to decode param \'' + val + '\'';
            err.status = err.statusCode = 400;
        }

        throw err;
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
