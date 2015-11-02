/**
 * Created by schwarzkopfb on 15/9/12.
 */

var http       = require('http'),
    proto      = http.IncomingMessage.prototype,
    parseQuery = require('querystring').parse,
    fresh      = require('fresh')

Object.defineProperties(proto, {
    pathLength: {
        get: function () {
            if('_pathLength' in this)
                return this._pathLength

            return this._pathLength = this.url.indexOf('?')
        }
    },

    queryString: {
        get: function() {
            if('_queryString' in this)
                return this._queryString

            if(~this.pathLength)
                return this._queryString = this.url.substring(this.pathLength + 1)
            else
                return this._queryString = ''
        }
    },

    query: {
        get: function() {
            if ('_query' in this)
                return this._query

            if(~this.pathLength)
                return this._query = parseQuery(this.queryString)
            else
                return {}
        }
    },

    path: {
        get: function() {
            if('_path' in this)
                return this._path

            if(~this.pathLength)
                return this._path = this.url.substring(0, this.pathLength)
            else
                return this._path = this.url
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
