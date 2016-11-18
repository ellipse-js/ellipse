'use strict'

const Ellipse = require('..'),
      body    = Buffer.from('Hello World'),
      app     = new Ellipse

var num = parseInt(process.env.MW || '1', 10)

console.log('  %s middleware', num)

while (num--)
    app.use(next => next())

app.use((req, res) => res.send(body))
   .listen(3333)
