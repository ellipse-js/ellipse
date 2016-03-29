/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var Ellipse = require('../'),
    app     = new Ellipse

app.get('/', function (req, res) {
    res.send('try any other route to get a 4oh4 response:\n/foo\n/bar')
})

// keep in mind that you can use Express-style '404' handlers as well,
// but if you do, then `missing` and `not found` events will not be fired
//app.all(function () {
//    this.status = 404
//    this.body   = 'Page not found.'
//    this.send()
//})

/*
    try:
    /foo
    /bar
    /*
 */
app.missing(function (ctx) {
    ctx.status = 404
    ctx.body   = 'Page not found.'
    ctx.send()
})

app.on('missing', function (ctx) {
    console.log('missing', ctx.url)
})

app.on('not found', function (ctx) {
    console.log('not found', ctx.url)
})

app.listen(3333)
