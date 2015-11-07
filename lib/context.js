/**
 * Created by schwarzkopfb on 15/10/27.
 */

var PassThrough         = require('stream').PassThrough,
    inherits            = require('util').inherits,
    onFinished          = require('on-finished')

function Context(app, req, res, upstream) {
    PassThrough.call(this)

    // references

    req.ctx = req.context = this
    res.ctx = res.context = this

    res.request  = res.req  =
    this.request = this.req = req
    req.response  = req.res  =
    this.response = this.res = res

    // let user pipe directly to context instead of ctx.res
    this.on('pipe', function (stream) {
        // handle stream errors
        if(!stream.listenerCount('error'))
            stream.on('error', this.next)

        // start streaming
        this.body = stream
        this.respond()
    })

    // generator support

    this._callbacks  = []
    this._downstream = []

    if(!app.release && upstream) {
        var ctx = this

        onFinished(res, function () {
            if (ctx._callbacks.length)
                setImmediate(function () {
                    ctx._dispatchUpstream()
                })
        })
    }
}

inherits(Context, PassThrough)

var descriptor = {
    _dispatchUpstream: {
        value: function _dispatchUpstream() {
            if (this._error) return

            var self       = this,
                callbacks  = this._callbacks,
                downstream = this._downstream

            while (downstream.length)
                downstream.pop().then(next)

            next()

            function next() {
                if (self._error || !callbacks.length)
                    return

                callbacks.pop()()
            }
        }
    },

    state: {
        get: function () {
            if(this._state)
                return this._state
            else
                return this._state = {}
        },

        set: function (value) {
            this._state = value
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

    // imitate a promise to make ctx 'yieldable'
    then: {
        value: function respond(callback) {
            this._callbacks.push(callback)
            this.send()
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
('cookie', 'cookies')
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
