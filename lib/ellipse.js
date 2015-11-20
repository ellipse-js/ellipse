/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict';

var Ellipse  = require('./application'),
    Router   = require('./router'),
    Context  = require('./context'),
    Request  = require('./request'),
    Response = require('./response')

Ellipse.version     = require('../package.json').version
Ellipse.Router      = Router
Ellipse.router      = Router.prototype
Ellipse.Context     = Context
Ellipse.context     = Context.prototype
Ellipse.Request     = Request
Ellipse.request     = Request.prototype
Ellipse.Response    = Response
Ellipse.response    = Response.prototype
Ellipse.Application = Ellipse
Ellipse.application = Ellipse.prototype

module.exports = Ellipse
