'use strict'

// expose

module.exports = Context

// includes

const Cookies    = require('cookies'),
      httpError  = require('http-errors'),
      httpAssert = require('http-assert'),
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
    respond: false,

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
        if (this._cookies)
            return this._cookies
        else
        return this._cookies = new Cookies(this._req, this._res, this.app.keys)
    },

    get state() {
        return this._state || (this._state = {})
    },

    set state(value) {
        this._state = value
    },

    get type() {
        return this._res.get('content-type') || 'text/html; charset=utf-8'
    },

    set type(value) {
        this._res.type(value)
    },

    get body () {
        return this._res._body
    },

    set body(value) {
        this._res._body = value
    },

    get text() {
        return this._res._body || (this.text = '')
    },

    set text(value) {
        this._res.type('text/plain')
        this._res._body = value
    },

    get html() {
        return this._res._body || (this.html = '')
    },

    set html(value) {
        this._res.type('text/html')
        this._res._body = value
    },

    get json() {
        return this._res._body || (this.json = {})
    },

    set json(value) {
        this._res.type('application/json')
        this._res._body = value
    },

    assert: function () {
        httpAssert.apply(this, arguments)
        return this // allow chaining
    },

    throw: function () {
        throw httpError.apply(this, arguments)
    },

    'catch': function (err) {
        this.router.onerror(this, err)
        return this // allow chaining
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

const descriptor = {}

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
('querystring', true)
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
('statusCode', true)
('status', 'statusCode', true)
('message', true)
('length', true)
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
