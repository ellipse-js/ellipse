'use strict'

require('./utils/polyfill')

// expose

const Ellipse = module.exports = require('./application')

// includes

const Router   = require('./router'),
      Context  = require('./context'),
      Request  = require('./request'),
      Response = require('./response')

// members

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
