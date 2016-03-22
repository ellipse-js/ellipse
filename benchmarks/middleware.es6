/**
 * Created by schwarzkopfb on 15/11/15.
 */

var ellipse = require('..'),
    app     = ellipse()

// number of middleware

var n = parseInt(process.env.MW || '1', 10)
console.log(`  ${n} middleware`)

while (n--)
    app.use(next => next())

var body = new Buffer('Hello World')

app.use(function *() {
    this.body = body
    this.send()
})

app.listen(3333)
