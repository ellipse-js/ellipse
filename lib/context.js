/**
 * Created by schwarzkopfb on 15/10/27.
 */

'use strict'

// expose

module.exports = Context

// includes

var Cookies    = require('cookies'),
    httpAssert = require('http-assert'),
    httpError  = require('http-errors'),
    alias      = require('./utils/alias')

// constructor

function Context(req, res) {
    this._req = req
    this._res = res

    req._ctx =
    res._ctx = this
}

// instance members

Context.prototype = {
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

    get cookies() {
        return this._cookies || (this._cookies = new Cookies(this._req, this._res, this.app.keys))
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
}

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
('ip')
('ips')
('path', true)
('query', true)
('queryString', true)
('querystring', 'queryString', true)
('search', true)
('params')
('param', 'params')
('host')
('hostname')
('fresh')
('stale')
('xhr')
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
('append')
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

// extend Context proto
Object.defineProperties(Context.prototype, descriptor)
