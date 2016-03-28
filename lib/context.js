/**
 * Created by schwarzkopfb on 15/10/27.
 */

'use strict'

// expose

module.exports = Context

// includes

var PassThrough = require('stream').PassThrough,
    inherits    = require('util').inherits,
    onFinished  = require('on-finished'),
    httpAssert  = require('http-assert'),
    httpError   = require('http-errors'),
    destroy     = require('destroy'),
    prototype   = require('./utils/prototype'),
    alias       = require('./utils/alias')

// constructor

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

// instance members

prototype(Context, {
    _dispatchUpstream: function dispatchUpstream() {
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
    },

    _addCallback: function addCallback(callback) {
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
    },

    _onPipe: function onPipe(stream) {
        this.body = stream
        this.send()
    },

    get state() {
        if(this._state)
            return this._state
        else
            return this._state = {}
    },

    set state(value) {
        this._state = value
    },

    get html() {
        // todo: set default
        return this.res._body || ''
    },

    set html(value) {
        this.res._body = value
        this.res.type  = 'text/html'
    },

    get json() {
        // todo: set default
        return this.res._body || {}
    },

    set json(value) {
        this.res._body = value
        this.res.type  = 'application/json'
    },

    pipe: function pipe(destination) {
        var req = this.req,
            res = this.res

        onFinished(req, function () {
            res.end()

            // destroy destination stream to prevent fd leaks
            destroy(destination)
        })

        // handle stream errors if needed
        if(!req.listenerCount('error'))
            req.on('error', this.next)

        return req.pipe(destination)
    },

    // imitate a promise to make ctx 'yieldable'
    then: function respond(callback) {
        this._addCallback(callback)
        this.send()
    },

    assert: function () {
        httpAssert.apply(this, arguments)
        return this // allow chaining
    },

    throw: function () {
        throw httpError.apply(this, arguments)
    },

    toJSON: function toJSON() {
        return {
            request:     this.req.toJSON(),
            response:    this.res.toJSON(),
            app:         this.app.toJSON(),
            originalUrl: this.originalUrl
        }
    },
    
    inspect: function inspect() {
        return this.toJSON()
    }
})

// aliases

var descriptor = {}

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
('lastModified', true)
('etag', true)
('ETag', 'etag', true)
('attachment')
('download')
('sendFile')
('send')
('respond', 'send')

// extend Context proto
Object.defineProperties(Context.prototype, descriptor)
