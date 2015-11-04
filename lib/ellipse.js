/**
 * Created by schwarzkopfb on 15/9/12.
 */

var merge   = require('merge-descriptors'),
    version = require('../package.json').version,
    Router  = require('./router'),
    router  = Router.prototype,
    proto   = require('./application'),
    Context = require('./context'),
    ctx     = Context.prototype,
    req     = require('./request'),
    res     = require('./response')

function createApplication() {
    var app = function(req, res, next) {
        app.handle(req, res, next)
    }

    app.__proto__   = proto

    app.app         = app
    app.router      = app
    app.application = app
    app.request     = { application: app, app: app, __proto__: req }
    app.response    = { application: app, app: app, __proto__: res }
    app.context     = { application: app, app: app, __proto__: ctx }

    app.init()

    return app
}

var ellipse = module.exports = createApplication

ellipse.version     = version
ellipse.Router      = Router
ellipse.router      = router
ellipse.context     = ctx
ellipse.request     = req
ellipse.response    = res
ellipse.application = proto
