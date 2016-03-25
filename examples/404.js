/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var Ellipse = require('../lib/ellipse'),
    app     = new Ellipse

app.get('/', function (req, res) {
    res.send('Hello!')
})

app.all(function () {
    this.res.status(404).send('Page not found.')
})

app.listen(3333)
