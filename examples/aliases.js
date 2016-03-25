/**
 * Created by schwarzkopfb on 15/9/14.
 */

'use strict'

var Ellipse = require('../lib/ellipse'),
    app     = new Ellipse

app.use(function (req, res) {
    console.log(req.method, req.originalUrl)

    //req.next()
    //res.next()
    this.next() // `ctx.next()`
})

app.get('/', function () {
    this.req.res.send('hey!') // `ctx.req.res`
})

app.get('/home', function (req, res) {
    var url = '/',
        qs  = res.req.queryString

    if(qs)
        url += '?' + qs

    res.redirect(url) // `res.req`
})

app.get('/shop', function () {
    // `ctx.request === ctx.req`
    this.send('Displaying ' + this.request.query.count + ' products.')
})

app.get('/404', function () {
    this.next() // `this === ctx`
})

app.listen(3333)
