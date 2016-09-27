var Ellipse = require('..'),
    app     = new Ellipse

// number of middleware

var n = parseInt(process.env.MW || '1', 10)
console.log('  %s middleware', n)

while (n--)
    app.use(next => next())

var body = new Buffer('Hello World')

app.use((req, res) => res.send(body))
   .listen(3333)
