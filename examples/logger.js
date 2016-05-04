/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var Ellipse = require('../'),
    // Ellipse has a built in http logger
    // that's enabled when `app.log === true`
    // by default `app.log` is true in development
    // environments
    app = new Ellipse({ log: true })

// fire the given callback after a random duration between 200ms and 1s
function delay(callback) {
    var time = Math.round(Math.random() * 800) + 200
    setTimeout(callback, time)
}

/*
    this route handles all the incoming requests

    try:
    /?foo=bar
    /foo
    /foo?bar
    /foo/bar
    /*

    after a few requests, see stdout
 */
app.all(function (req, res) {
    delay(function () {
        res.type('text/plain')
           .send([
                    'try:',
                    '/?foo=bar',
                    '/foo',
                    '/foo?bar',
                    '/foo/bar',
                    '/*',
                    '',
                    'after a few requests see stdout'
                 ].join('\n'))
    })
})

// start server
app.listen(3333)
