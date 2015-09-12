/**
 * Created by schwarzkopfb on 15/9/12.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse()

app.get('/', function (req, res) {
    var name = req.query.name || 'Ellipse'

    res.send('Welcome ' + name + '!')
})

app.get('/:name', function (req, res) {
    var name = req.params.name || 'Ellipse'

    res.send('Hello ' + name + '!')
})

app.get('/:greeting/:name', function (req) {
    var name = req.params.name || 'Ellipse'

    this.send(req.params.greeting + ' ' + name + '!')
})

app.listen(3333, function () {
    console.log('server is ready to accept connections on port 3333')
})
