'use strict'

// expose

module.exports = Context

// includes

const Cookies    = require('cookies'),
      delegate   = require('delegates'),
      httpError  = require('http-errors'),
      httpAssert = require('http-assert')

// constructor

function Context(req, res) {
    this._req = req
    this._res = res

    req._ctx = res._ctx = this
}

// instance members

const proto = Context.prototype = {
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

    /**
     * Get the HTTP response status code.
     *
     * @returns {number}
     */
    get status() {
        return this._res.statusCode
    },

    /**
     * Set the HTTP response status code.
     *
     * @param value {number}
     */
    set status(value) {
        this._res.statusCode = value
    },

    get body() {
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

delegate(proto, '_req')
    .getter('headers')
    .access('method')
    .access('url')
    .getter('originalUrl')
    .getter('href')
    .getter('ip')
    .getter('ips')
    .access('path')
    .access('query')
    .access('querystring')
    .access('search')
    .getter('params')
    .getter('host')
    .getter('hostname')
    .getter('fresh')
    .getter('stale')
    .getter('xhr')
    .getter('socket')
    .getter('protocol')
    .getter('secure')
    .getter('subdomains')
    .method('get')
    .getter('accept')
    .method('accepts')
    .method('acceptsEncodings')
    .method('acceptsCharsets')
    .method('acceptsLanguages')
    .method('is')

delegate(proto, '_res')
    .getter('app')
    .getter('application')
    .method('append')
    .getter('router')
    .access('statusCode')
    .access('message')
    .access('length')
    .access('headersSent')
    .getter('finished')
    .method('redirect')
    .method('set')
    .method('remove')
    .access('lastModified')
    .access('etag')
    .method('attachment')
    .method('download')
    .method('sendFile')
    .method('send')
