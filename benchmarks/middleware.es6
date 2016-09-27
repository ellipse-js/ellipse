'use strict'

var Ellipse = require('..'),
    app     = new Ellipse({ etag: false })

// number of middleware

var n = parseInt(process.env.MW || '1', 10)
console.log(`  ${n} middleware`)

while (n--)
    app.use(function *(next) {
        yield *next
    })

var body = new Buffer('Hello World')

app.use(function *() {
    this.body = body
    this.send()
})

app.listen(3333)
