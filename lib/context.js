/**
 * Created by schwarzkopfb on 15/10/27.
 */

var Stream              = require('stream'),
    PassThrough         = Stream.PassThrough,
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

            // error: `next()` instead of `yield next` from a generator
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

    // imitate a promise, to make it yieldable
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
        value: function () {
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
            return this._html || ''
        },

        set: function (value) {
            this._html = value
        }
    },

    pipe: {
        value: function (destination) {
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

    respond: {
        value: function () {
            var res  = this.res,
                type = this.type || this.contentType,
                code = this.code || this.status

            res.statusCode    = code || 200
            res.statusMessage = this.message

            if(type)
                res.set('content-type', type)

            if(this.html && !this.body)
                res.html(this.html)
            else
                res.send()
        }
    }
}

// helper to add aliases to ctx

function alias(obj, name, field, writable) {
    if(arguments.length === 3 && typeof field === 'boolean') {
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
}

var req = alias.bind(null, 'req'),
    res = alias.bind(null, 'res')

// define aliases

// request
req('headers')
req('header', 'headers')
req('method', true)
req('url', true)
req('originalUrl')
req('href')
req('path', true)
req('query', true)
req('queryString', true)
req('querystring', 'queryString', true)
req('cookies')
req('params')
req('param', 'params')
req('host')
req('hostName')
req('hostname', 'hostName')
req('fresh')
req('socket')
req('protocol')
req('secure')
req('subdomains')
req('get')

// response
res('next')
res('app')
res('application', 'app')
res('router')
res('body', true)
res('json', 'body', true)
res('code', 'statusCode', true)
res('statusCode', true)
res('status', 'statusCode', true)
res('statusMessage', true)
res('message', 'statusMessage', true)
res('length', true)
res('contentLength', 'length', true)
//res('cookies') req alias covers this case as well
res('type', true)
res('contentType', 'type', true)
res('headersSent')
res('headerSent', 'headersSent')
res('redirect')
res('set')
res('remove')
res('throw')
res('assert')

// extend ctx prototype
Object.defineProperties(Context.prototype, descriptor)

// expose
module.exports = Context
