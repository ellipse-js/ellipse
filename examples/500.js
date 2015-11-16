/**
 * Created by schwarzkopfb on 15/9/12.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse()

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
app.error(function (err, req, res) {
    console.error(err.stack || err)

    res.status(500).send('Ouch!')
})

app.listen(3333)