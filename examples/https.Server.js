/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var fs      = require('fs'),
    ellipse = require('../lib/ellipse'),
    app     = ellipse()

app.get('/', function (req, res) {
    var name = req.query.name || 'Ellipse'

    res.body = 'Welcome ' + name + '!'
    res.body += [
        '\n',
        'try:',
        '/John',
        '/Jack',
        '/*',
        '/hello/Jack',
        '/aloha/John'
    ].join('\n')

    res.send()
})

/*
    try:
    /John
    /Jack
 */
app.get('/:name', function (req, res) {
    res.send('Hello ' + req.params.name + '!')
})

/*
    try:
    /hello/Jack
    /aloha/John
 */
app.get('/:greeting/:name', function (req, res) {
    res.send(req.params.greeting + ' ' + req.params.name + '!')
})

// `app.callback()` returns a request listener function that's suitable for Node's https.Server as well
require('https').createServer({
    key:  fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app.callback()).listen(3333)
