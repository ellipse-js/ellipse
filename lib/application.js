/**
 * Created by schwarzkopfb on 15/9/12.
 */

var http     = require('http'),
    util     = require('util'),
    extend   = util._extend,
    inherits = util.inherits,
    Router   = require('./router'),
    req      = require('./request'),
    res      = require('./response'),
    ctx      = require('./context')

function Ellipse(options) {
    var app = function(req, res, next) {
        app.handle(req, res, next)
    }

    app.__proto__   = Ellipse.prototype

    app.app         = app
    app.router      = app
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
            this._env = value
        }
    },

    listen: {
        value: function listen() {
            var server = http.createServer(this.handle.bind(this))
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
