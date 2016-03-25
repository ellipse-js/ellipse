/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var Ellipse = require('../'),
    app     = new Ellipse

app.get('/', function (req, res) {
    res.send('try any other route to get a 4oh4 response:\n/foo\n/bar')
})

/*
    try:
    /foo
    /bar
    /*
 */
app.all(function () {
    this.res.status(404).send('Page not found.')
})

app.listen(3333)
