/**
 * Created by schwarzkopfb on 15/9/12.
 */

function delay(callback) {
    var duration = Math.round(Math.random() * 800) + 400 // generate random duration between 400 and 800 ms

    setTimeout(callback, duration)
}

var ellipse = require('../lib/ellipse'),
    app     = ellipse()

app.use(function (req, res, next) {
    var timestamp = +new Date,
        end       = res.end

    res.end = function (body) {
        console.log(req.method, req.originalUrl, '-', res.statusCode, +new Date - timestamp + 'ms', res.get('content-length'))

        end.apply(res, arguments)
    }

    next()
})

app.get('/', function (req, res) {
    delay(function () {
        res.send('Hello!')
    })
})

app.get('/page/:num', function (req, res) {
    res.send('Page #' + req.params.num)
})

app.listen(3333)