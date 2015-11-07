/**
 * Created by schwarzkopfb on 15/11/5.
 */

var http    = require('http'),
    ellipse = require('..'),
    app     = ellipse()

// number of middleware

var n = parseInt(process.env.MW || '1', 10)
console.log('  %s middleware', n)

while (n--)
    app.use(function *(ctx, req, res, next) {
        next()
    })

var body = new Buffer('Hello World')

app.use(function(ctx, req, res) {
    res.send(body)
})

app.listen(3333)
