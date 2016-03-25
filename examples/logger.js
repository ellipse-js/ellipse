/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var Ellipse = require('../lib/ellipse'),
    // Ellipse has a built in http logger
    // that's enabled when `app.log === true`
    // by default `app.log` is true in development
    // environments
    app = new Ellipse({ log: true })

function delay(callback) {
    // generate random duration between 200ms and 1s
    var time = Math.round(Math.random() * 800) + 200
    setTimeout(callback, time)
}

app.get('/', function (req, res) {
    delay(function () {
        res.send('Hello!')
    })
})

app.listen(3333)
