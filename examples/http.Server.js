/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var Ellipse = require('../lib/ellipse'),
    app     = new Ellipse

app.get('/', function (req, res) {
    var name = req.query.name || 'Ellipse'

    res.send('Welcome ' + name + '!')
})

app.get('/:name', function (req, res) {
    res.send('Hello ' + req.params.name + '!')
})

app.get('/:greeting/:name', function (req, res) {
    res.send(req.params.greeting + ' ' + req.params.name + '!')
})

// `app.callback()` returns a request listener function that's suitable tor Node's http.Server
require('http').createServer(app.callback()).listen(3333)
