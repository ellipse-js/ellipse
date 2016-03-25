/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var Ellipse = require('../lib/ellipse'),
    app     = new Ellipse

app.get('/', function (req, res) {
    res.send('Hello!')
})

app.get('/throw', function () {
    throw Error('fake')
})

app.get('/next', function (req, res, next) {
    next(Error('fake'))
})

// catch errors
app.on('error', function (err, ctx) {
    console.error(err.stack || err)

    ctx.status = 500
    ctx.send('Ouch!')
})

app.listen(3333)
