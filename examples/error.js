/**
 * Created by schwarzkopfb on 15/9/15.
 */

'use strict'

var Ellipse = require('../lib/ellipse'),
    app1    = new Ellipse,
    app2    = new Ellipse,
    app3    = new Ellipse

// app1

app1.get('/', function (req, res, next) {
    // statusCode and statusMessage can be set with extra arguments passed to `next(err, [status], [message])`
    next('fake error', 501, 'Too late...')
})

app1.listen(3333)

// app2

app2.get('/', function () {
    throw 'fake error'
})

var router = app2.mount('/error')

router.get('/', function (req, res, next) {
    // errors from sub-routers will bubble up to the parent router's error handler
    next('fake error')
})

// you can catch unhandled errors from middleware and request handler functions
// with `app.error(handler)` or `app.catch(handler)`
app2.error(function (err, req, res) {
    // receive errors from `app2` and `router` here
    res.status(500).send('Ouch!')
})

app2.listen(3334)

// app3

app3.get('/', function (req, res, next) {
    next('fake error', 502)
})

router = app3.mount('/error')

router.get('/*', function () {
    throw 'fake error'
})

// you can also use the `error` event to catch unhandled errors
router.on('error', function (err, ctx) {
    // receive errors only from `router` here
    ctx.status = 500
    ctx.send('Something went wrong under the /error* route.')
})

app3.on('error', function (err, ctx) {
    // receive errors only from `app3` here
    ctx.status = 500
    ctx.send('Something went wrong.')
})

app3.listen(3335)
