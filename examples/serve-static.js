/**
 * Created by schwarzkopfb on 15/9/15.
 */

'use strict'

var Ellipse = require('../lib/ellipse'),
    app     = new Ellipse,
    // simply use the official static server of Express
    serve   = require('serve-static')

/*
    try:
    /examples/app.js
    /examples/aliases.js
    /examples/logger.js
    etc.
 */
// include static file server middleware
app.use('/examples', serve(__dirname))

// main route
app.get('/', function (req, res) {
    res.send([
        'try:',
        '/examples/app.js',
        '/examples/aliases.js',
        '/examples/logger.js',
        'etc.'
    ].join('\n'))
})

// start listening
app.listen(3333)
