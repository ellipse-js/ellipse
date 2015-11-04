/**
 * Created by schwarzkopfb on 15/9/12.
 */

var http       = require('http'),
    parseQuery = require('querystring').parse,
    fresh      = require('fresh'),
    proto      = http.IncomingMessage.prototype

Object.defineProperties(proto, {
    pathLength: {
        get: function () {
            if('_pathLength' in this)
                return this._pathLength

            return this._pathLength = this.url.indexOf('?')
        }
    },

    queryString: {
        set: function (qs) {
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
            this._query = query
        },

        get: function() {
            if ('_query' in this)
                return this._query

            console.log(this.constructor.name)

            return this._query = ~this.pathLength ? parseQuery(this.queryString) : {}
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

    get: {
        // let Express overwrite it,
        // this allows Express and Ellipse to be used together
        writable: true,

        value: function get(field) {
            return this.headers[ field.toLowerCase() ]
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

            return false;
        }
    }
})

module.exports = proto
