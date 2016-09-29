'use strict'

const Ellipse = require('..'),
      app     = new Ellipse

/*
    try:
    /?name=John
 */
app.get('/', (req, res) => {
    var name = req.query.name || 'Ellipse'

    res.body = 'Welcome ' + name + '!'
    res.body += [
        '\n',
        'try:',
        '/?name=John',
        '/source',
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
    /source
 */
app.get('/source', function () {
    // send the source code of this app
    // just for demonstration
    this.sendFile('app.js')
})

/*
    try:
    /John
    /Jack
 */
app.get('/:name', (req, res) =>
    res.html('<h1>Hello ' + req.params.name + '!</h1>'))

/*
    try:
    /hello/Jack
    /aloha/John
 */
app.get('/:greeting/:name', function (req, res) {
    this.json = {
        status: 'success',
        data: {
            greeting: req.params.greeting,
            name:     req.params.name
        }
    }
    this.send()
})

// start listening
app.listen(3333, () =>
    console.log('server is ready to accept connections on port 3333'))
