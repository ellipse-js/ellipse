/**
 * Created by schwarzkopfb on 15/9/15.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse(),
    serve   = require('serve-static') // ensure 'serve-static' is installed

app.use('/examples', serve(__dirname))

app.get('/', function (req, res) {
    res.send('hey!')
})

app.listen(3333)

// try: /examples/app.js
//      /examples/aliases.js
//      /examples/logger.js
//      etc.