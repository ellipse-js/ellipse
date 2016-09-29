'use strict'

const fs      = require('fs'),
      ellipse = require('..'),
      app     = ellipse()

app.get('/', (req, res) => {
    const name = req.query.name || 'Ellipse'

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

    res.type('text/plain').send()
})

/*
    try:
    /John
    /Jack
 */
app.get('/:name', (req, res) =>
    res.send('Hello ' + req.params.name + '!'))

/*
    try:
    /hello/Jack
    /aloha/John
 */
app.get('/:greeting/:name', (req, res) =>
    res.send(req.params.greeting + ' ' + req.params.name + '!'))

const opts = {
    key:  fs.readFileSync(__dirname + '/../test/test.key'),
    cert: fs.readFileSync(__dirname + '/../test/test.crt'),
    passphrase: 'test'
}

// `app.callback()` returns a request listener function which is suitable for Node's https.Server
require('https').createServer(opts, app.callback()).listen(3333)
