/**
 * Created by schwarzkopfb on 15/9/15.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse()

// extend app prototype

ellipse.application.figureOutPortAndListen = function (callback) {
    var port = +process.argv[2] || +process.env.PORT || 3333

    this.listen(port, callback)
}

// extend router prototype

// totally useless, just for demonstration
ellipse.router.wait = function (seconds) {
    this.all(function (req, res, next) {
        setTimeout(next, seconds * 1000)
    })
}

// extend response prototype with some helper utils that are useful for REST APIs

app.response.error = function (code, message) {
    this.status(code, message).json({
        status: 'error',
        message: message
    })
}

app.response.success = function (result) {
    var resp = {
        status: 'success'
    }

    if(arguments.length)
        resp.data = result

    this.json(resp)
}

// object containing example data

var db = {
    users: {
        '1': {
            id: 1,
            name: 'John Doe'
        }
    }
}

// routes

app.param('id', function (req, res, next, id) {
    req.user = db.users[ id ]
    next()
})

// note that extensions of router will also appear on app,
// because app inherits from router
app.wait(.5)

app.get('/api/user/:id', function (req, res) {
    if(req.user)
        res.success(req.user)
    else
        res.error(404, 'No user found with the given id.')
})

// start listening

app.figureOutPortAndListen(function () {
    console.log('server is ready to accept connections on port 3333')
})
