/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict';

var http     = require('http'),
    util     = require('util'),
    path     = require('path'),
    assert   = require('assert'),
    extend   = util._extend,
    inherits = util.inherits,
    Router   = require('./router'),
    req      = require('./request').prototype,
    res      = require('./response').prototype,
    ctx      = require('./context').prototype

function Ellipse(options) {
    var app = function(req, res, next) {
        app.handle.apply(app, arguments)
    }

    app.__proto__   = Ellipse.prototype

    app.app         =
    app.router      =
    app.application = app
    app.request     = { __proto__: req }
    app.response    = { __proto__: res }
    app.context     = { __proto__: ctx }

    extend(app, options)

    app.init()

    return app
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

    env: {
        get: function () {
            return this._env || process.env.NODE_ENV || 'development'
        },

        set: function (value) {
            assert(typeof value === 'string', 'app.env must be string')

            this._env = value
        }
    },

    root: {
        get: function () {
            return this._root || '.'
        },

        set: function (value) {
            assert(typeof value === 'string', 'app.root must be string')

            this._root = path.resolve(value)
        }
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
