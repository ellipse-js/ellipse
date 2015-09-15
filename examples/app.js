/**
 * Created by schwarzkopfb on 15/9/12.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse()

app.get('/', function (req, res) {
    var name = req.query.name || 'Ellipse'

    res.send('Welcome ' + name + '!')
})

app.get('/source', function (req, res) {
    // send the source code of this app
    res.sendFile(__filename)
})

app.get('/:name', function (req, res) {
    res.html('<h1>Hello ' + req.params.name + '!</h1>')
})

app.get('/:greeting/:name', function (req, res) {
    res.json({
        status: 'success',
        data: {
            greeting: req.params.greeting,
            name:     req.params.name
        }
    })
})

app.listen(3333, function () {
    console.log('server is ready to accept connections on port 3333')
})
