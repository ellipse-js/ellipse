/**
 * Created by schwarzkopfb on 15/9/12.
 */

var merge  = require('merge-descriptors'),
    Router = require('./router'),
    proto  = require('./application'),
    req    = require('./request'),
    res    = require('./response')

function createApplication() {
    var app = function(req, res, next) {
        app.handle(req, res, next)
    }

    merge(app, proto)
    merge(app, Router.prototype)

    app.app         = app
    app.application = proto
    app.router      = Router()
    app.request     = req
    app.response    = res

    app.init()

    return app
}

var ellipse = module.exports = createApplication

ellipse.Router   = Router
ellipse.request  = req
ellipse.response = res
