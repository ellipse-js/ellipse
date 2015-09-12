/**
 * Created by schwarzkopfb on 15/9/12.
 */

var http       = require('http'),
    proto      = http.IncomingMessage.prototype,
    parseQuery = require('querystring').parse

Object.defineProperties(proto, {
    query: {
        get: function () {
            if ('_query' in this)
                return this._query

            if(~this.pathLength)
                return this._query = parseQuery(this.queryString)
            else
                return {}
        }
    },

    pathLength: {
        get: function () {
            if('_pathLength' in this)
                return this._pathLength

            return this._pathLength = this.originalUrl.indexOf('?')
        }
    },

    queryString: {
        get: function () {
            if('_queryString' in this)
                return this._queryString

            if(~this.pathLength)
                return this._queryString = this.originalUrl.substring(this.pathLength + 1)
            else
                return this._queryString = ''
        }
    },

    path: {
        get: function () {
            if('_path' in this)
                return this._path

            if(~this.pathLength)
                return this._path = this.originalUrl.substring(0, this.pathLength)
            else
                return this._path = this.originalUrl
        }
    },

    originalUrl: {
        get: function () {
            return this._originalUrl || this.url
        }
    },

    get: {
        value: function (field) {
            return this.headers[ field.toLowerCase() ]
        }
    }
})

module.exports = proto
