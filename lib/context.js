/**
 * Created by schwarzkopfb on 15/10/27.
 */

var PassThrough         = require('stream').PassThrough,
    inherits            = require('util').inherits,
    onFinished          = require('on-finished'),
    isGeneratorFunction = require('./utils').isGeneratorFunction

function Context(req, res) {
    function respond(callback) {
        try {
            var caller = arguments.callee.caller

            ctx.assert(
                callback instanceof Function,
                'Calling context.then() directly is not supported.'
            )

            // error: `this.then()` instead of `yield this` from a generator
            // it should mess up the order of upstream dispatch, so avoid direct calls
            if (caller)
                ctx.assert(
                    !isGeneratorFunction(caller),
                    'Calling `this()` directly from a generator function is not supported. Use `yield this` instead.'
                )

            ctx._callbacks.push(callback)
            ctx.respond()
        }
        catch(ex) {
            ctx.next(ex)
        }
    }

    var ctx = this

    PassThrough.call(ctx)

    // imitate a promise to make it yieldable
    ctx.then = respond

    req.ctx = req.context = ctx
    res.ctx = res.context = ctx

    res.request  = res.req = ctx.request  = ctx.req = req
    req.response = req.res = ctx.response = ctx.res = res

    ctx.state = {}

    // let user pipe directly to context instead of ctx.res
    ctx.on('pipe', function (stream) {
        // handle stream errors
        if(!stream.listenerCount('error'))
            stream.on('error', ctx.next)

        // start streaming
        ctx.body = stream
        ctx.respond()
    })

    // generator support

    ctx._callbacks  = []
    ctx._downstream = []

    onFinished(res, function () {
        ctx._dispatchUpstream()
    })
}

inherits(Context, PassThrough)

var descriptor = {
    _dispatchUpstream: {
        value: function _dispatchUpstream() {
            if(this._error) return

            var self       = this,
                callbacks  = this._callbacks,
                downstream = this._downstream

            while(downstream.length)
                downstream.pop().then(next)

            next()

            function next() {
                if(self._error || !callbacks.length) return

                callbacks.pop()()
            }
        }
    },

    html: {
        get: function () {
            return this.res.body
        },

        set: function (value) {
            var res = this.res

            res.body        = value
            res.contentType = 'text/html'
        }
    },

    pipe: {
        value: function pipe(destination) {
            var req = this.req,
                res = this.res

            onFinished(req, function () {
                res.end()
            })

            // handle stream errors
            if(!req.listenerCount('error'))
                req.on('error', this.next)

            return req.pipe(destination)
        }
    },

    toJSON: {
        value: function toJSON() {
            return {
                request:     this.req.toJSON(),
                response:    this.res.toJSON(),
                app:         this.app.toJSON(),
                originalUrl: this.originalUrl
            }
        }
    },
    
    inspect: {
        value: function inspect() {
            return this.toJSON()
        }
    }
}

// helper to add aliases to ctx

function alias(obj) {
    return function addAlias(name, field, writable) {
        if(arguments.length === 2 && typeof field === 'boolean') {
            writable = field
            field    = null
        }

        if(!field)
            field = name

        var member = {
            get: function () {
                return this[ obj ][ field ]
            }
        }

        if(writable)
            member[ 'set' ] = function (value) {
                this[ obj ][ field ] = value
            }

        descriptor[ name ] = member

        return addAlias
    }
}

// define aliases

// request
alias('req')
('headers')
('header', 'headers')
('method', true)
('url', true)
('originalUrl')
('href')
('path', true)
('query', true)
('queryString', true)
('querystring', 'queryString', true)
('cookies')
('params')
('param', 'params')
('host')
('hostName')
('hostname', 'hostName')
('fresh')
('socket')
('protocol')
('secure')
('subdomains')
('get')

// response
alias('res')
('next')
('app')
('application', 'app')
('router')
('body', true)
('json', 'body', true)
('code', 'statusCode', true)
('statusCode', true)
('status', 'statusCode', true)
('statusMessage', true)
('message', 'statusMessage', true)
('length', true)
('contentLength', 'length', true)
('type', true)
('contentType', 'type', true)
('headersSent')
('headerSent', 'headersSent')
('redirect')
('set')
('remove')
('throw')
('assert')
('send')
('respond', 'send')

// extend ctx prototype
Object.defineProperties(Context.prototype, descriptor)

// expose
module.exports = Context
