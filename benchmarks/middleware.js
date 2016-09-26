/**
 * Created by schwarzkopfb on 15/11/15.
 */

var Ellipse = require('..'),
    app     = new Ellipse

// number of middleware

var n = parseInt(process.env.MW || '1', 10)
console.log('  %s middleware', n)

while (n--)
    app.use(function (next) {
        next()
    })

var body = new Buffer('Hello World')

app.use(function () {
    this.body = body
    this.send()
})

app.listen(3333)
