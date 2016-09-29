'use strict'

// expose

const Ellipse = module.exports = require('./application')

// includes

const version  = require('../package.json').version,
      Router   = require('./router'),
      Context  = require('./context'),
      Request  = require('./request'),
      Response = require('./response')

// members

Ellipse.version     = version
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

// inspection helpers

Ellipse.toJSON = function toJSON() {
    return {
        version:     version,
        Router:      Router,
        router:      '<Router prototype>',
        Context:     Context,
        context:     '<Context prototype>',
        Request:     Request,
        request:     '<Request prototype>',
        Response:    Response,
        response:    '<Response prototype>'
    }
}

Ellipse.inspect = function inspect() {
    return Ellipse.toJSON()
}
