/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

// expose

var Request = module.exports = require('http').IncomingMessage

// includes

var assert         = require('assert'),
    qs             = require('querystring'),
    parseQuery     = qs.parse,
    stringifyQuery = qs.stringify,
    fresh          = require('fresh'),
    accepts        = require('accepts'),
    typeis         = require('type-is'),
    slice          = Array.prototype.slice,
    prototype      = require('./utils/prototype')

// instance members

prototype(Request, {
    get ctx() {
        return this._ctx
    },

    get context() {
        return this._ctx
    },

    get res() {
        return this._ctx._res
    },

    get response() {
        return this._ctx._res
    },

    get accept() {
        if('_accept' in this)
            return this._accept

        return this._accept = accepts(this)
    },

    get pathLength() {
        if('_pathLength' in this)
            return this._pathLength

        return this._pathLength = this.url.indexOf('?')
    },

    get queryString() {
        if('_queryString' in this)
            return this._queryString

        return this._queryString = ~this.pathLength ? this.url.substring(this.pathLength + 1) : ''
    },

    set queryString(qs) {
        assert.equal(typeof qs, 'string', 'QueryString must be string.')

        this._query       = parseQuery(qs)
        this._queryString = qs
    },

    get query() {
        if('_query' in this)
            return this._query

        return this._query = ~this.pathLength ? parseQuery(this.queryString) : {}
    },

    set query(query) {
        assert(query instanceof Object, 'Query must be an object.')

        this._query       = query
        this._queryString = stringifyQuery(query)
    },

    get search() {
        return '?' + this.queryString
    },

    set search(value) {
        assert.equal(typeof value, 'string', 'Search must be string.')
        assert.equal(value[ 0 ], '?', 'Search string must start with a \'?\'.')

        this.queryString = value.substring(1)
    },

    get protocol() {
        var proxy = this.app.proxy

        if (this.socket.encrypted)
            return 'https'
        else if (!proxy)
            return 'http'

        var proto = this.get('X-Forwarded-Proto') || 'http'

        return proto.split(/\s*,\s*/)[ 0 ]
    },

    get host() {
        var proxy = this.app.proxy,
            host  = proxy && this.get('X-Forwarded-Host')

        host = host || this.get('Host')

        return host ? host.split(/\s*,\s*/)[ 0 ] : ''
    },

    get hostName() {
        return (this.host || '').split(':')[ 0 ]
    },

    get origin() {
        return this.protocol + '://' + this.host
    },

    get path() {
        if('_path' in this)
            return this._path

        if(~this.pathLength)
            return this._path = this.url.substring(0, this.pathLength)
        else
            return this._path = this.url
    },

    set path(path) {
        assert.equal(typeof path, 'string', 'path must be string')

        var l = this._pathLength = path.indexOf('?')

        if(~l)
            this._path = path.substring(0, this.pathLength)
        else
            this._path = path
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
        return this._length || +this.get('content-length') || undefined
    },

    // let the user override this prop for custom use
    // (eg. `body-parser` sets it)
    set length(value) {
        this._length = value
    },

    get type() {
        var type = this.get('content-type')

        return type ? type.split(';')[0] : ''
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
})

// methods

var descriptor = {}

require('./utils/defineMethod')(descriptor)

('get', function get(field) {
    return this.headers[ field.toLowerCase() ] || ''
})

('accepts', function accepts() {
    return this.accept.types.apply(this.accept, arguments)
})

('acceptsEncodings', function acceptsEncodings() {
    return this.accept.encodings.apply(this.accept, arguments)
})

('acceptsCharsets', function acceptsCharsets() {
    return this.accept.charsets.apply(this.accept, arguments)
})

('acceptsLanguages', function acceptsLanguages() {
    return this.accept.languages.apply(this.accept, arguments)
})

('is', function typeIs(types) {
    if (!types)
        return typeis(this)
    else if (!Array.isArray(types))
        types = slice.call(arguments)

    return typeis(this, types)
})

// extend Request proto
Object.defineProperties(Request.prototype, descriptor)
