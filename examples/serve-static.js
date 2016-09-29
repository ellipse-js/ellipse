'use strict'

const Ellipse = require('..'),
      app     = new Ellipse,
      serve   = require('serve-static') // Express' official static server middleware

/*
    try:
    /examples/app.js
    /examples/https.js
    /examples/params.js
    etc.
 */
// include static file server middleware
app.use('/examples', serve(__dirname))

app.get('/', (req, res) => {
    res.type('text/plain')
        .send([
            'try:',
            '/examples/app.js',
            '/examples/https.js',
            '/examples/params.js',
            'etc.'
        ].join('\n'))
})

// start listening
app.listen(3333)
