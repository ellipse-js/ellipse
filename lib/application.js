/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var http      = require('http'),
    path      = require('path'),
    assert    = require('assert'),
    extend    = require('util')._extend,
    inherits  = require('util').inherits,
    getETagFn = require('./utils/ETag'),
    Router    = require('./router'),
    res       = require('./response').prototype,
    req       = require('./request').prototype,
    ctx       = require('./context').prototype

function Ellipse(options) {
    if(!(this instanceof Ellipse))
        return new Ellipse(options)

    Router.call(this)

    if (options)
        extend(this, options)

    this.app =
    this.router =
    this.application = this

    this.response = { __proto__: res }
    this.request  = { __proto__: req }
    this.context  = { __proto__: ctx }

    // load logger lazily only if required
    var log = this.log
    if (
        log === true ||
        log === this.env ||
        log instanceof Function)
    {
        var logger = require('ellipse-logger')
        this.use(logger({ write: log }))
    }
}

inherits(Ellipse, Router)

Object.defineProperties(Ellipse.prototype, {
    proxy: {
        writable: true,
        value: false
    },

    subdomainOffset: {
        writable: true,
        value: 2
    },

    log: {
        get: function () {
            var log = this._log
            return log !== undefined ? log : 'development'
        },

        set: function (value) {
            if (value === true)
                value = this.env

            this._log = value
        }
    },

    env: {
        get: function () {
            return this._env || process.env.NODE_ENV || 'development'
        },

        set: function (value) {
            assert.equal(typeof value, 'string', 'app.env must be string')

            this._env = value
        }
    },

    root: {
        get: function () {
            return this._root || (this._root = path.resolve('.'))
        },

        set: function (value) {
            assert.equal(typeof value, 'string', 'app.root must be string')

            this._root = path.resolve(value)
        }
    },

    etag: {
        get: function () {
            return this._etag || 'weak'
        },

        set: function (value) {
            this._etag   = value
            this._etagFn = getETagFn(value)
        }
    },

    _etagFn: {
        writable: true,
        value: getETagFn(true)
    },

    listen: {
        value: function listen() {
            var server = http.createServer(this.callback())
            return server.listen.apply(server, arguments)
        }
    },

    toJSON: {
        value: function () {
            return {
                subdomainOffset: this.subdomainOffset,
                proxy: this.proxy,
                env: this.env
            }
        }
    },

    inspect: {
        value: function () {
            return this.toJSON()
        }
    }
})

module.exports = Ellipse
