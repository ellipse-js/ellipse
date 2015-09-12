/**
 * Created by schwarzkopfb on 15/9/12.
 */

var merge  = require('merge-descriptors'),
    Router = require('./router'),
    proto  = require('./application'),
    req    = require('./request'),
    res    = require('./response')

function createApplication() {
    var app = function(req, res) {
        app.handle(req, res)
    }

    app.router   = Router()
    app.request  = req
    app.response = res

    merge(app, proto)
    merge(app, Router.prototype)

    return app
}

module.exports = createApplication
