/**
 * Created by schwarzkopfb on 15/10/27.
 */

var Stream      = require('stream'),
    PassThrough = Stream.PassThrough,
    inherits    = require('util').inherits,
    onFinished  = require('on-finished'),
    statusCodes = require('http').STATUS_CODES,
    slice       = Array.prototype.slice

function Context(req, res) {
    PassThrough.call(this)

    // let user pipe directly to context instead of context.res
    this.on('pipe', function (stream) {
        stream.pipe(res)
    })

    res.body = ''

    this.request  = this.req = req
    this.response = this.res = res
    this.state = {}

    // generator support

    this._callbacks  = []
    this._downstream = []

    onFinished(this.res, this._dispatchUpstream.bind(this))
}

inherits(Context, PassThrough)

var descriptor = {
    _dispatchUpstream: {
        value: function () {
            if(this._error) return

            var self       = this,
                callbacks  = this._callbacks,
                downstream = this._downstream

            while(downstream.length)
                downstream.shift().then(next)

            next()

            function next() {
                if(self._error || !callbacks.length) return

                callbacks.pop()()
            }
        }
    },

    // todo: cookies

    app: {
        get: function () {
            return this.res.app
        }
    },

    next: {
        get: function () {
            return this.res.next
        }
    },

    'throw': {
        value: function (code, message, body) {
            var ise = 'Internal Server Error'

            switch (arguments.length) {
                case 0:
                    code    = 500
                    message = body = ise
                    break

                case 1:
                    switch (typeof code) {
                        case 'number':
                            message = body = statusCodes[ code ] || ise
                            break

                        case 'string':
                            message = body = code
                            code    = 500
                            break

                        default:
                            body    = code
                            code    = 500
                            message = ise
                    }
                    break

                case 2:
                    switch (typeof code) {
                        case 'number':
                            if(typeof message !== 'string') {
                                body    = message
                                message = statusCodes[ code ] || ise
                            }
                            break

                        case 'string':
                            if(typeof message === 'string') {
                                body    = message
                                message = code
                                code    = 500
                            }
                            else {
                                var tmp = message
                                message = body = code
                                code    = tmp
                            }
                            break

                        default:
                            body = code

                            switch (typeof message) {
                                case 'number':
                                    code    = message
                                    message = statusCodes[ code ] || ise
                                    break

                                case 'string':
                                    code = 500
                                    break

                                default:
                                    throw Error('Invalid arguments provided for `context.throw([code], [message], [body])`')
                            }
                    }
                    break

                case 3:
                    if (typeof code === 'string') {
                        tmp     = code
                        code    = message
                        message = tmp
                    }
            }

            if(typeof code !== 'number' || typeof message !== 'string')
                throw Error('Invalid arguments provided for `context.throw([code], [message], [body])`')

            this.res.status(code, message)

            if(!body)
                body = message

            if(body instanceof Object)
                this.res.json(body)
            else
                this.res.send(body + '')
        }
    },

    assert: {
        value: function (value, code, message, body) {
            if(!value) {
                var args = slice.call(arguments, 1)
                this.throw.apply(this, args)
            }
        }
    },

    pipe: {
        value: function (destination) {
            var req = this.req,
                res = this.res

            onFinished(req, function () {
                res.end()
            })

            return req.on('error', this.next).pipe(destination)
        }
    },

    respond: {
        value: function () {
            var res  = this.res,
                type = this.type || this.contentType,
                code = this.code || this.status,
                body = res.body

            if (body == null) {
                type = 'text'
                body = this.message || String(code) || '200'
            }

            res.statusCode    = code || 200
            res.statusMessage = this.message

            res.set('content-type', type)

            if(body instanceof Stream)
                body.pipe(res)
            else if(body instanceof Buffer)
                res.send(body)
            else if(body instanceof Object)
                res.json(body)
            else
                res.send(body)
        }
    }
}

// helper to add aliases to ctx

function alias(obj, name, field, writable) {
    if(arguments.length === 3 && typeof field === 'boolean') {
        writable = field
        field    = null
    }

    if(!field)
        field = name

    var member = {
        get: function () {
            return this[ obj ][ field ]
        }
    }

    if(writable)
        member[ 'set' ] = function (value) {
            this[ obj ][ field ] = value
        }

    descriptor[ name ] = member
}

var req = alias.bind(null, 'req'),
    res = alias.bind(null, 'res')

// define aliases

// request
req('headers')
req('header', 'headers')
req('method', true)
req('url', true)
req('originalUrl')
req('href')
req('path', true)
req('query', true)
req('queryString', true)
req('querystring', 'queryString', true)
req('params')
req('param', 'params')
req('host')
req('hostName')
req('hostname', 'hostName')
req('fresh')
req('socket')
req('protocol')
req('secure')
req('subdomains')
req('get')

// response
res('body', true)
res('code', 'statusCode', true)
res('statusCode', true)
res('status', 'statusCode', true)
res('statusMessage', true)
res('message', 'statusMessage', true)
res('length', true)
res('contentLength', 'length', true)
res('type', true)
res('contentType', 'type', true)
res('headersSent')
res('headerSent', 'headersSent')
res('redirect')

// extend ctx prototype
Object.defineProperties(Context.prototype, descriptor)

// expose
module.exports = Context
