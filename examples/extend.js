/**
 * Created by schwarzkopfb on 15/9/15.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse()

// extend Ellipse with some helper utils that are useful for REST apis

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

// an object containing example data

var db = {
    users: {
        '1': {
            id: 1,
            name: 'John Doe'
        }
    }
}

// routes

app.get('/api/user/:id', function (req, res) {
    var id = req.params.id

    if(id in db.users)
        res.success(db.users[id])
    else
        res.error(404, 'No user found with the given id.')
})

// start listening

app.listen(3333, function () {
    console.log('server is ready to accept connections on port 3333')
})
