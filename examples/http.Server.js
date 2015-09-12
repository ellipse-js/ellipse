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

app.get('/:greeting/:name', function () {
    var name = this.req.params.name || 'Ellipse'

    this.send(this.req.params.greeting + ' ' + name + '!')
})

require('http').createServer(app).listen(3333)
