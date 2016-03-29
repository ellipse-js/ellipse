/**
 * Created by schwarzkopfb on 15/10/27.
 */

'use strict'

// expose

module.exports = Context

// includes

var onFinished = require('on-finished'),
    httpAssert = require('http-assert'),
    httpError  = require('http-errors'),
    destroy    = require('destroy'),
    prototype  = require('./utils/prototype'),
    alias      = require('./utils/alias')

// constructor

function Context(req, res) {
    // references

    this._req = req
    this._res = res

    req._ctx =
    res._ctx = this

    // internal props for generator support

    //this._callbacks  = []
    //this._downstream = []
}

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

            //setImmediate(callbacks.pop())
            callbacks.pop()
        }
    },

    _addCallback: function addCallback(callback) {
        var callbacks = this._callbacks

        if(!callbacks.length) {
            var ctx = this

            onFinished(this._res, function () {
                //setImmediate(function () {
                    ctx._dispatchUpstream()
                //})
            })
        }

        callbacks.push(callback)
    },

    get res() {
        return this._res
    },

    get response() {
        return this._res
    },

    get req() {
        return this._req
    },

    get request() {
        return this._req
    },

    get state() {
        return this._state || (this._state = {})
    },

    set state(value) {
        this._state = value
    },

    get text() {
        return this._res._body || (this.text = '')
    },

    set text(value) {
        this._res.type  = 'text/plain'
        this._res._body = value
    },

    get html() {
        return this._res._body || (this._res._body = '')
    },

    set html(value) {
        this._res._body = value
    },

    get json() {
        return this._res._body || (this._res._body = {})
    },

    set json(value) {
        this._res._body = value
    },

    // imitate a promise to make ctx 'yieldable'
    //then: function respond(callback) {
    //    this._addCallback(callback)
    //    this.send()
    //},

    assert: function () {
        httpAssert.apply(this, arguments)
        return this // allow chaining
    },

    throw: function () {
        throw httpError.apply(this, arguments)
    },

    toJSON: function toJSON() {
        return {
            request:     this._req.toJSON(),
            response:    this._res.toJSON(),
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
alias('_req', descriptor)
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
alias('_res', descriptor)
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
