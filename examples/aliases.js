/**
 * Created by schwarzkopfb on 15/9/14.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse()

app.use(function (req, res) {
    console.log(req.method, req.originalUrl)

    //req.next() // `req.next()`
    res.next() // `res.next()`
})

app.get('/', function (req) {
    req.res.send('hey!') // `req.res`
})

app.get('/home', function (req, res) {
    var url = '/',
        qs  = res.req.queryString

    if(qs)
        url += '?' + qs

    res.redirect(url) // `res.req`
})

app.get('/shop', function () {
    // `this` is `res` in middleware functions
    this.send('Displaying ' + this.req.query.count + ' products.')
})

app.get('/404', function () {
    this.next() // because `this` is `res` and `next()` is referenced in it (first example)
})

app.listen(3333)
