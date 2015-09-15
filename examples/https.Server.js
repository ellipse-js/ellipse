/**
 * Created by schwarzkopfb on 15/9/12.
 */

var fs      = require('fs'),
    ellipse = require('../lib/ellipse'),
    app     = ellipse()

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

// you can pass `app` directly as a requestListener to Node's https.Server
require('https').createServer({ key: fs.readFileSync('key.pem'), cert: fs.readFileSync('cert.pem') }, app).listen(3333)
