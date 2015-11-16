/**
 * Created by schwarzkopfb on 15/9/12.
 */

var Ellipse = require('./application'),
    Router  = require('./router')

Ellipse.version     = require('../package.json').version
Ellipse.Router      = Router
Ellipse.router      = Router.prototype
Ellipse.context     = require('./context').prototype
Ellipse.request     = require('./request')
Ellipse.response    = require('./response')
Ellipse.application = Ellipse.prototype

module.exports = Ellipse
