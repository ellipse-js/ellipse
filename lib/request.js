'use strict'

// expose

/**
 * @name Request
 * @extends http.IncomingMessage
 * @exports Request
 */
var Request = module.exports = require('http').IncomingMessage

// includes

var assert         = require('assert'),
    qs             = require('querystring'),
    parseQuery     = qs.parse,
    stringifyQuery = qs.stringify,
    fresh          = require('fresh'),
    accepts        = require('accepts'),
    typeis         = require('type-is'),
    slice          = Array.prototype.slice

// instance members

var prototype = {
    /**
     * Get the `Context` associated with request.
     *
     * @instance
     * @member ctx
     * @type {Context}
     */
    get ctx() {
        return this._ctx
    },

    /**
     * Get the `Context` associated with request.
     *
     * @instance
     * @member context
     * @type {Context}
     */
    get context() {
        return this._ctx
    },

    /**
     * Get the response associated with this request.
     *
     * @instance
     * @member res
     * @type {Response}
     */
    get res() {
        return this._ctx._res
    },

    /**
     * Get the response associated with this request.
     *
     * @instance
     * @member response
     * @type {Response}
     */
    get response() {
        return this._ctx._res
    },

    /**
     * Check if the given Content-Type is acceptable via `accepts`.
     *
     * @instance
     * @member accept
     * @type {string|null}
     */
    get accept() {
        return this._accept || (this._accept = accepts(this))
    },

    /**
     * Get the length of request pathname.
     *
     * @instance
     * @member pathLength
     * @type {number}
     */
    get pathLength() {
        var index = this.url.indexOf('?')
        return ~index ? index : this.url.length
    },

    /**
     * Get request pathname excluding query-string.
     *
     * @instance
     * @member path
     * @type {string}
     */
    get path() {
        return this.url.substring(0, this.pathLength)
    },

    /**
     * Set request path and url.
     *
     * @instance
     * @member path=
     * @type {string}
     */
    set path(path) {
        assert.equal(typeof path, 'string', '`path` must be string')
        this.url = path + this.search
    },

    /**
     * Get request query-string void of '?'.
     *
     * @instance
     * @member querystring
     * @type {string}
     */
    get querystring() {
        return this._querystring || (this._querystring = this.url.substring(this.pathLength + 1))
    },

    /**
     * Set request query-string. This ignores first leading '?' if present.
     *
     * @instance
     * @member querystring=
     * @type {string}
     */
    set querystring(qs) {
        assert.equal(typeof qs, 'string', '`querystring` must be string')

        if (qs[ 0 ] === '?')
            qs = qs.substring(1)

        delete this._query

        this._querystring = qs
        this.url          = this.path + this.search
    },

    /**
     * Get request query-string parsed with core `querystring` module.
     *
     * @instance
     * @member query
     * @type {object}
     */
    get query() {
        return this._query || (this._query = parseQuery(this.querystring))
    },

    /**
     * Set request query object and the corresponding query-string using core `querystring` module.
     *
     * @instance
     * @member query=
     * @type {object}
     */
    set query(query) {
        assert(query instanceof Object, '`query` must be an object')

        this._query       = query
        this._querystring = stringifyQuery(query)
    },

    /**
     * Get request query-string with the leading '?'.
     *
     * @instance
     * @member search
     * @type {string}
     */
    get search() {
        return '?' + this.querystring
    },

    set search(value) {
        assert.equal(typeof value, 'string', '`search` must be string')

        this.querystring = value
    },

    get protocol() {
        var proxy = this.app.proxy

        if (this.socket.encrypted)
            return 'https'
        else if (!proxy)
            return 'http'

        var proto = this.get('x-forwarded-proto') || 'http'

        return proto.split(/\s*,\s*/)[ 0 ]
    },

    get host() {
        var proxy = this.app.proxy,
            host  = proxy && this.get('x-forwarded-host')

        host = host || this.get('host')

        return host ? host.split(/\s*,\s*/)[ 0 ] : ''
    },

    get hostname() {
        return (this.host || '').split(':')[ 0 ]
    },

    get origin() {
        return this.protocol + '://' + this.host
    },

    get href() {
        if (/^https?:\/\//i.test(this.originalUrl))
            return this.originalUrl

        return this.origin + this.originalUrl
    },

    get secure() {
        return this.protocol === 'https'
    },

    get subdomains() {
        var host   = this.hostName || '',
            offset = this.app.subdomainOffset

        return ~host.indexOf('.') ? host.split('.').reverse().slice(offset) : []
    },

    get length() {
        return this._length || (this._length = +this.get('content-length')) || undefined
    },

    // let the user override this prop for custom use
    // (eg. `body-parser` sets it)
    set length(value) {
        this._length = value
    },

    get type() {
        var type = this.get('content-type')

        return type ? type.split(';')[ 0 ] : ''
    },

    get fresh() {
        var method = this.method,
            s      = this.res.statusCode

        // GET or HEAD for weak freshness validation only
        if ('GET' != method && 'HEAD' != method)
            return false

        // 2xx or 304 as per rfc2616 14.26
        if ((s >= 200 && s < 300) || 304 == s)
            return fresh(this.headers, this.res._headers || {})

        return false
    },

    get stale() {
        return !this.fresh
    },

    get ip() {
        return this._ip || (this._ip = this.ips[ 0 ] || this.socket.remoteAddress || '')
    },

    get ips() {
        if (this._ips)
            return this._ips

        var proxy = this.app.proxy,
            value = proxy && this.get('x-forwarded-for'),
            ips   = value
                ? value.split(/\s*,\s*/)
                : []

        return this._ips = ips
    },

    get xhr() {
        return this._xhr || (this._xhr = this.get('X-Requested-With') === 'XMLHttpRequest')
    },

    toJSON: function toJSON() {
        return {
            method:  this.method,
            url:     this.url,
            headers: this.headers
        }
    },

    inspect: function inspect() {
        return this.toJSON()
    }
}

// inherit

var descriptor = {}

Object
    .getOwnPropertyNames(prototype)
    .forEach(function (name) {
        descriptor[ name ] = Object.getOwnPropertyDescriptor(prototype, name)
    })

// methods

function requestTypeIs(types) {
    if (!types)
        return typeis(this)
    else if (!Array.isArray(types))
        types = slice.call(arguments)

    return typeis(this, types)
}

function getRequestHeader(field) {
    return this.headers[ field.toLowerCase() ] || ''
}

function requestAccepts() {
    return this.accept.types.apply(this.accept, arguments)
}

function requestAcceptsEncodings() {
    return this.accept.encodings.apply(this.accept, arguments)
}

function requestAcceptsCharsets() {
    return this.accept.charsets.apply(this.accept, arguments)
}

function requestAcceptsLanguages() {
    return this.accept.languages.apply(this.accept, arguments)
}

// aliases

require('./utils/defineMethod')(descriptor)

('is', requestTypeIs)
('get', getRequestHeader)
('accepts', requestAccepts)
('acceptsCharsets', requestAcceptsCharsets)
('acceptsEncodings', requestAcceptsEncodings)
('acceptsLanguages', requestAcceptsLanguages)

// extend Request proto
Object.defineProperties(Request.prototype, descriptor)
