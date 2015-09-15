/**
 * Created by schwarzkopfb on 15/9/12.
 */

var merge  = require('merge-descriptors'),
    router = require('./router'),
    proto  = require('./application'),
    req    = require('./request'),
    res    = require('./response')

function createApplication() {
    var app = function(req, res, next) {
        app.handle(req, res, next)
    }

    merge(app, proto)
    merge(app, router.prototype)

    app.application = proto
    app.router      = router()
    app.request     = req
    app.response    = res

    app.init()

    return app
}

var ellipse = module.exports = createApplication

ellipse.Application = proto
ellipse.Router      = router
ellipse.Request     = req
ellipse.Response    = res
