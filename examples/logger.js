/**
 * Created by schwarzkopfb on 15/9/12.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse(),
    logger  = require('morgan') // ensure 'morgan' is installed

function delay(callback) {
    // generate random duration between 200ms and 1s
    var time = Math.round(Math.random() * 800) + 200

    setTimeout(callback, time)
}

// morgan logger: https://npmjs.org/package/morgan
app.use(logger(':date[clf] - :method :url :status :res[content-length] - :response-time ms'))

app.get('/', function (req, res) {
    delay(function () {
        res.send('Hello!')
    })
})

app.listen(3333)