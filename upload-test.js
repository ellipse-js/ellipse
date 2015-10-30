/**
 * Created by schwarzkopfb on 15/10/28.
 */

var http = require('http')

var opts = {
    hostname: 'localhost',
    port: 3333,
    path: '/upload',
    method: 'POST'
}

var req = http.request(opts, function () {
    console.log('request ended')
})

req.on('error', console.error)
req.write('Hello Pipes!\nYeah, fucking cool!\n')

setTimeout(function () {
    req.end()
}, 10000)

console.log('done')
