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

    listen: {
        value: function listen() {
            var server = http.createServer(this.handle.bind(this))
            return server.listen.apply(server, arguments)
        }
    }
})
