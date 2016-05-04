/**
 * Created by schwarzkopfb on 15/9/14.
 */

'use strict'

var Ellipse = require('../'),
    app     = new Ellipse

// simple logger
app.use(function (req, res) {
    console.log(req.method, req.originalUrl)

    //req.next()
    //res.next()
    this.next() // `ctx.next()`
})

// main route
app.get('/', function () {
    // `ctx.req.res`
    this.req.res.send([
        'try:',
        '/home',
        '/home?foo=bar',
        '/home?foo=bar&redirect',
        '/shop',
        '/shop?count=42',
        '/404'
    ].join('\n'))
})

/*
    try:
    /home
    /home?foo=bar
    /home?foo=bar&redirect
 */
app.get('/home', function (req, res) {
    var url = '/',
        qs  = res.req.querystring // `res.req`

    if(qs)
        url += '?' + qs

    if('redirect' in res.req.query)
        res.redirect(url)
    else
        res.send('url: ' + url)
})

/*
    try:
    /shop
    /shop?count=42
 */
app.get('/shop', function () {
    // `ctx.request === ctx.req`
    this.send('Displaying ' + this.request.query.count + ' products.')
})

/*
    try:
    /404
 */
app.get('/404', function () {
    this.next() // `this === ctx`
})

// start listening
app.listen(3333)
