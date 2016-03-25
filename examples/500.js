/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var Ellipse = require('../lib/ellipse'),
    app     = new Ellipse

app.get('/', function (req, res) {
    res.body = [
        'try:',
        '/next',
        '/throw'
    ].join('\n')

    res.send()
})

app.get('/throw', function () {
    throw Error('fake')
})

app.get('/next', function (req, res, next) {
    next(Error('fake'))
})

/*
    catch errors

    try:
    /next
    /throw
*/
app.on('error', function (err, ctx) {
    console.error(err.stack || err)

    ctx.status = 500
    ctx.send('Ouch!')
})

app.listen(3333)
