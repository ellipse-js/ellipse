/**
 * Created by schwarzkopfb on 15/9/15.
 */

var ellipse = require('../lib/ellipse'),
    api     = ellipse(),
    express = require('express'), // tip: ensure 'express' is installed
    app     = express()

app.get('/', function (req, res) {
    res.send('hey!')
})

app.get('/home', function (req, res) {
    res.redirect('/')
})

// you can use an Ellipse app or router as an Express middleware
app.use('/api', api)

api.get('/user', function (req, res) {
    res.json({
        id: 1,
        firstName: 'John',
        lastName: 'Doe'
    })
})

api.get('/comment', function (req, res) {
    res.json({
        id: 1,
        timestamp: +new Date,
        text: 'lorem ipsum dolor sit amet'
    })
})

app.listen(3333)