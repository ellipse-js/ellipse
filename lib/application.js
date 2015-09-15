/**
 * Created by schwarzkopfb on 15/9/12.
 */

var http = require('http')

Object.defineProperties(module.exports, {
    listen: {
        enumerable: true,

        value: function listen() {
            var server = http.createServer(this.handle.bind(this))
            return server.listen.apply(server, arguments)
        }
    }
})
