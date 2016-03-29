/**
 * Created by schwarzkopfb on 15/10/28.
 */

var http = require('http'),
    ctr  = 0

function request(url) {
    var i    = ++ctr,
        opts = {
            hostname: 'localhost',
            port: 3333,
            path: url,
            method: 'POST'
        }

    var req = http.request(opts, function (res) {
        res.on('data', function (chunk) {
            console.log(chunk.toString())
        })
        res.on('end', function () {
            console.log('request finished', i)
        })
    })

    req.on('error', console.error)
    req.write('Hello Pipes!')
    req.end()

    //setTimeout(function () {
    //    req.end()
    //}, 10000)

    console.log('request sent', i)
}

request('/upload')
request('/cancel-upload')
request('/cancel-upload-lazy')
