'use strict'

const Ellipse = require('..'),
      app     = new Ellipse

app.get('/', (req, res) =>
    res.type('text/plain')
       .send('try any other route to get a 4oh4 response:\n/foo\n/bar'))

/*
    try:
    /foo
    /bar
    /*
 */
app.on('notFound', ctx => {
    ctx.status = 404
    ctx.body   = 'Page not found.'
    ctx.send()
})

/*
    You can use Express-style '404' handlers as well,
    but if you do, then `notFound` event will not be emitted.
*/
//app.all(function () {
//    this.status = 404
//    this.body   = 'Page not found.'
//    this.send()
//})

app.listen(3333)
