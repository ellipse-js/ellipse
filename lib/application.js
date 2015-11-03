/**
 * Created by schwarzkopfb on 15/9/12.
 */

var http   = require('http'),
    router = require('./router').prototype,
    app    = module.exports

app.prototype = app.__proto__ = router

Object.defineProperties(app, {
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
