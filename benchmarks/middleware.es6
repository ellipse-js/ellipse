'use strict'

const Ellipse = require('..'),
      body    = Buffer.from('Hello World'),
      app     = new Ellipse({ etag: false })

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
