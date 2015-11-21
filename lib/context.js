/**
 * Created by schwarzkopfb on 15/10/27.
 */

'use strict';

var PassThrough = require('stream').PassThrough,
    inherits    = require('util').inherits,
    onFinished  = require('on-finished'),
    httpAssert  = require('http-assert'),
    httpError   = require('http-errors'),
    alias       = require('./utils/alias')

function Context(req, res) {
    PassThrough.call(this)

    // references

    req.ctx = req.context = this
    res.ctx = res.context = this

    res.request   = res.req  =
    this.request  = this.req = req
    req.response  = req.res  =
    this.response = this.res = res

    // let user pipe directly to context instead of `ctx.res`
    this.on('pipe', this._onPipe)

    // generator support

    this._callbacks  = []
    this._downstream = []
}

inherits(Context, PassThrough)

var descriptor = {
    _dispatchUpstream: {
        value: function dispatchUpstream() {
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

                setImmediate(callbacks.pop())
            }
        }
    },

    _addCallback: {
        value: function addCallback(callback) {
            var callbacks = this._callbacks

            if(!callbacks.length) {
                var ctx = this

                onFinished(this.res, function () {
                    setImmediate(function () {
                        ctx._dispatchUpstream()
                    })
                })
            }

            callbacks.push(callback)
        }
    },

    _onPipe: {
        value: function onPipe(stream) {
            this.body = stream
            this.send()
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
            return this.res._body || ''
        },

        set: function (value) {
            this.res._body       = value
            this.res.contentType = 'text/html'
        }
    },

    json: {
        get: function () {
            return this.res._body || {}
        },

        set: function (value) {
            this.res._body       = value
            this.res.contentType = 'application/json'
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
            this._addCallback(callback)
            this.send()
        }
    },

    assert: {
        value: function () {
            httpAssert.apply(this, arguments)
            return this // allow chaining
        }
    },

    throw: {
        value: function () {
            throw httpError.apply(this, arguments)
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

// define aliases

// request
alias('req', descriptor)
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
('search', true)
('cookies')
('cookie', 'cookies')
('params')
('param', 'params')
('host')
('hostName')
('hostname', 'hostName')
('fresh')
('stale')
('socket')
('protocol')
('secure')
('subdomains')
('get')
('accept')
('accepts')
('acceptsEncodings')
('acceptsEncoding', 'acceptsEncodings')
('acceptsCharsets')
('acceptsCharset', 'acceptsCharsets')
('acceptsLanguages')
('acceptsLanguage', 'acceptsLanguages')
('is')
('typeIs', 'is')

// response
alias('res', descriptor)
('next')
('app')
('application')
('router')
('body', true)
('code', true)
('status', 'code', true)
('message', true)
('length', true)
('type', true)
('headersSent')
('headerSent', 'headersSent')
('finished')
('redirect')
('set')
('remove')
('attachment')
('download')
('sendFile')
('send')
('respond', 'send')

// extend Context proto
Object.defineProperties(Context.prototype, descriptor)

// expose
module.exports = Context
