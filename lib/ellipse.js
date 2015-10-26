/**
 * Created by schwarzkopfb on 15/9/12.
 */

var version = require('../package.json').version,
    Router  = require('./router'),
    router  = Router.prototype,
    proto   = require('./application'),
    req     = require('./request'),
    res     = require('./response')

function createApplication() {
    var app = function(req, res, next) {
        app.handle(req, res, next)
    }

    app.prototype = app.__proto__ = proto

    app.app         = app
    app.router      = new Router()
    app.request     = req
    app.response    = res
    app.application = proto

    app.init()

    return app
}

var ellipse = module.exports = createApplication

ellipse.version     = version
ellipse.Router      = Router
ellipse.router      = router
ellipse.request     = req
ellipse.response    = res
ellipse.application = proto
