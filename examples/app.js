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

app.get('/source', function () {
    // send the source code of this app
    // just for demonstration
    this.sendFile('app.js')
})

app.get('/:name', function (req, res) {
    res.html('<h1>Hello ' + req.params.name + '!</h1>')
})

app.get('/:greeting/:name', function (req, res) {
    this.json = {
        status: 'success',
        data: {
            greeting: req.params.greeting,
            name:     req.params.name
        }
    }
    this.send()
})

app.listen(3333, function () {
    console.log('server is ready to accept connections on port 3333')
})
