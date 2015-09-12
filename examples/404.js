/**
 * Created by schwarzkopfb on 15/9/12.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse()

app.get('/', function (req, res) {
    res.send('Hello!')
})

app.get('/page/:num', function (req, res) {
    res.send('Page #' + req.params.num)
})

app.all('*', function (req) {
    req.res.status(404).send('Page not found.')
})

app.listen(3333)