/**
 * Created by schwarzkopfb on 15/9/12.
 */

var app    = module.exports,
    http   = require('http')

app.listen = function listen() {
    var server = http.createServer(this.handle.bind(this))
    return server.listen.apply(server, arguments)
}