/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var http           = require('http'),
    assert         = require('assert'),
    qs             = require('querystring'),
    parseQuery     = qs.parse,
    stringifyQuery = qs.stringify,
    fresh          = require('fresh'),
    accepts        = require('accepts'),
    typeis         = require('type-is'),
    Request        = http.IncomingMessage,
    slice          = Array.prototype.slice

var descriptor = {
    accept: {
        get: function () {
            if('_accept' in this)
                return this._accept

            return this._accept = accepts(this)
        }
    },

    pathLength: {
        get: function () {
            if('_pathLength' in this)
                return this._pathLength

            return this._pathLength = this.url.indexOf('?')
        }
    },

    queryString: {
        set: function (qs) {
            assert(typeof qs === 'string', 'QueryString must be string.')

            this._query       = parseQuery(qs)
            this._queryString = qs
        },

        get: function() {
            if('_queryString' in this)
                return this._queryString

            return this._queryString = ~this.pathLength ? this.url.substring(this.pathLength + 1) : ''
        }
    },

    query: {
        set: function (query) {
            assert(query instanceof Object, 'Query must be an object.')

            this._query       = query
            this._queryString = stringifyQuery(query)
        },

        get: function() {
            if('_query' in this)
                return this._query

            return this._query = ~this.pathLength ? parseQuery(this.queryString) : {}
        }
    },

    search: {
        get: function () {
            return '?' + this.queryString
        },

        set: function (value) {
            assert(typeof value === 'string', 'Search must be string.')
            assert(value[ 0 ] === '?', 'Search string must start with a \'?\'.')

            this.queryString = value.substring(1)
        }
    },

    protocol: {
        get: function () {
            var proxy = this.app.proxy

            if (this.socket.encrypted)
                return 'https'
            else if (!proxy)
                return 'http'

            var proto = this.get('X-Forwarded-Proto') || 'http'

            return proto.split(/\s*,\s*/)[ 0 ]
        }
    },

    host: {
        get: function () {
            var proxy = this.app.proxy,
                host  = proxy && this.get('X-Forwarded-Host')

            host = host || this.get('Host')

            return host ? host.split(/\s*,\s*/)[ 0 ] : ''
        }
    },

    hostName: {
        get: function () {
            return (this.host || '').split(':')[ 0 ]
        }
    },

    origin: {
        get: function () {
            return this.protocol + '://' + this.host
        }
    },

    path: {
        set: function (path) {
            assert(typeof path === 'string', 'Path must be string.')

            var l = this._pathLength = path.indexOf('?')

            if(~l)
                this._path = path.substring(0, this.pathLength)
            else
                this._path = path
        },

        get: function() {
            if('_path' in this)
                return this._path

            if(~this.pathLength)
                return this._path = this.url.substring(0, this.pathLength)
            else
                return this._path = this.url
        }
    },

    href: {
        get: function () {
            if (/^https?:\/\//i.test(this.originalUrl))
                return this.originalUrl

            return this.origin + this.originalUrl
        }
    },

    secure: {
        get: function () {
            return this.protocol === 'https'
        }
    },

    subdomains: {
        get: function () {
            var host   = this.hostName || '',
                offset = this.app.subdomainOffset || 2

            return ~host.indexOf('.') ? host.split('.').reverse().slice(offset) : []
        }
    },

    length: {
        get: function () {
            return +this.get('content-length') || undefined
        }
    },

    type: {
        get: function () {
            var type = this.get('content-type')

            return type ? type.split(';')[0] : ''
        }
    },

    fresh: {
        get: function() {
            var method = this.method,
                s      = this.res.statusCode

            // GET or HEAD for weak freshness validation only
            if ('GET' != method && 'HEAD' != method)
                return false

            // 2xx or 304 as per rfc2616 14.26
            if ((s >= 200 && s < 300) || 304 == s)
                return fresh(this.headers, this.res._headers || {})

            return false
        }
    },

    stale: {
        get: function () {
            return !this.fresh
        }
    },

    toJSON: {
        value: function toJSON() {
            return {
                method:  this.method,
                url:     this.url,
                headers: this.headers
            }
        }
    },

    inspect: {
        value: function inspect() {
            return this.toJSON()
        }
    }
}

// define methods

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

// expose

module.exports = Request
