/**
 * Created by schwarzkopfb on 15/9/12.
 */

var ellipse    = require('../lib/ellipse'),
    app        = ellipse(),
    bodyParser = require('body-parser') // tip: ensure 'body-parser' is installed

app.use(bodyParser.urlencoded({ extended: false }))

app.post('/api/user', function (req, res) {
    res.json(req.body)
})

app.post('/api/comment', function (req, res) {
    res.json(req.body)
})

app.listen(3333)