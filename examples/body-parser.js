/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var Ellipse    = require('../lib/ellipse'),
    app        = new Ellipse,
    // simply use the official body parser of Express
    bodyParser = require('body-parser')

app.use(bodyParser.json())

app.post('/api/user', function (req, res) {
    res.json(req.body)
})

app.post('/api/comment', function (req, res) {
    res.json(req.body)
})

app.listen(3333)
