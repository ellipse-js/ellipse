'use strict'

const Ellipse = require('..'),
      body    = new Buffer('Hello World'),
      app     = new Ellipse

var num = parseInt(process.env.MW || '1', 10)

console.log('  %s middleware', num)

while (num--)
    app.use(function *(next) {
        yield *next
    })

app.use(function *() {
    this.send(body)
})

app.listen(3333)
