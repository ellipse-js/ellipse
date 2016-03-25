/**
 * Created by schwarzkopfb on 15/9/15.
 */

'use strict'

var Ellipse = require('../lib/ellipse'),
    app     = new Ellipse,
    // simply use the official static server of Express
    serve   = require('serve-static')

app.use('/examples', serve(__dirname))

app.get('/', function (req, res) {
    res.send('hey!')
})

app.listen(3333)

// try: /examples/app.js
//      /examples/aliases.js
//      /examples/logger.js
//      etc.
