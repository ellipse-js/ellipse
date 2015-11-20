/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict';

var http        = require('http'),
    Stream      = require('stream'),
    send        = require('send'),
    escapeHtml  = require('escape-html'),
    sendfile    = require('./utils/sendFile'),
    isAbsolute  = require('./utils/isAbsolute'),
    Response    = http.ServerResponse,
    statusCodes = http.STATUS_CODES

// property descriptor

var descriptor = {
    body: {
        get: function () {
            return this._body || ''
        },

        set: function (value) {
            this._body = value
        }
    },

    contentType: {
        get: function () {
            return this.get('content-type')
        },

        set: function (value) {
            this.set('content-type', value)
        }
    },

    toJSON: {
        value: function toJSON() {
            return {
                status:  this.statusCode,
                message: this.statusMessage,
                headers: this.headers
            }
        }
    },

    inspect: {
        value: function inspect() {
            var result = this.toJSON()

            if(this.body)
                result.body = this.body

            return result
        }
    }
}

// define methods

require('./utils/defineMethod')(descriptor)

('send', function send(body) {
    body = body || this.body

    var status  = this.statusCode || 200,
        message = this.message || this.statusMessage || statusCodes[ status ],
        headers = this.headers || {},
        type    = 'text/plain',
        length  = this.length,
        kind    = bodyType(body)

    if(kind === 'object') {
        type = 'application/json'
        body = jsonToString(body, this.app.env)
        kind = 'string'
    }
    else if(kind === 'stream' || kind === 'buffer')
        type = 'application/octet-stream'

    if(!length)
        switch(kind) {
            case 'buffer':
                length = body.length
                break

            case 'string':
                length = Buffer.byteLength(body)
                break

            default:
                if(kind !== 'stream')
                    length = 0
        }

    var contentType = this.contentType || type

    if(kind === 'string' && !~contentType.indexOf('charset'))
        contentType += '; charset=utf8'

    if(!headers[ 'Content-Length' ] && length !== undefined)
        headers[ 'Content-Length' ] = length

    this.contentType = contentType

    // freshness
    if (this.req.fresh)
        this.statusCode = status = 304

    // strip irrelevant headers
    if (status === 204 || status === 304) {
        delete headers[ 'Content-Type' ]
        delete headers[ 'Content-Length' ]
        delete headers[ 'Transfer-Encoding' ]
        body = ''
    }

    this.writeHead(status, message, headers)

    if(this.req.method !== 'HEAD') {
        if(kind === 'stream') {
            // handle stream errors
            if(!body.listenerCount('error'))
                body.on('error', this.next)

            body.pipe(this)
        }
        else
            this.end(body)
    }
    else
        this.end()
}, true)

('status', function status(code, message) {
    this.statusCode    = code
    this.statusMessage = message || statusCodes[ code ]
}, true)

('get', function get(field) {
    if(!this.headers)
        return

    return this.headers[ capitalizeHeaderField(field) ]
})

('set', function (field, value) {
    if(!this.headers)
        this.headers = {}

    this.headers[ capitalizeHeaderField(field) ] = value
}, true)

('remove', function remove(field) {
    delete this.headers[ capitalizeHeaderField(field) ]
}, true)

('json', function (body) {
    this.contentType = 'application/json'
    this.body        = jsonToString(body, this.app.env)
    this.send()
}, true)

('html', function html(body) {
    this.contentType = 'text/html'
    this.send(body)
}, true)

('redirect', function redirect(url) {
    var message = statusCodes[ 302 ]

    switch (this.get('accept')) {
        case 'text/plain':
        case 'text/*':
            this.contentType = 'text/plain'
            this.body        = message + '. Redirecting to ' + encodeURI(url)
            break

        case 'text/html':
        case '*/*':
            var u = escapeHtml(url)
            this.contentType = 'text/html'
            this.body        = '<p>' + message + '. Redirecting to <a href="' + u + '">' + u + '</a></p>'
            break

        default:
            this.body = ''
            break
    }

    this.status(302)
        .set('location', url)
        .send()
}, true)

/**
 * Respond request with a file.
 * Ported from Express (https://github.com/strongloop/express)
 *
 * @param path {string} File path
 * @param options {object} An object containing options
 * @param callback
 */
('sendFile', function sendFile(path, options, callback) {
    var done = callback,
        req  = this.req,
        res  = this,
        next = this.next,
        opts = options || {}

    if (!path)
        throw new TypeError('path argument is required to res.sendFile')

    // support function as second arg
    if (options instanceof Function) {
        done = options
        opts = {}
    }

    if (!opts.root && !isAbsolute(path))
        throw new TypeError('path must be absolute or specify root to res.sendFile')

    // create file stream
    var pathname = encodeURI(path),
        file     = send(req, pathname, opts)

    // transfer
    sendfile(res, file, opts, function (err) {
        if (done) return done(err)

        if (err && err.code === 'EISDIR')
            return next()

        // next() all but write errors
        if (err && err.code !== 'ECONNABORTED' && err.syscall !== 'write')
            next(err)
    })
}, true)

// extend Response proto
Object.defineProperties(Response.prototype, descriptor)

// utils

function capitalizeHeaderField(field) {
    return field.split('-').map(function (part) {
        return part[ 0 ].toUpperCase() + part.substring(1).toLowerCase()
    }).join('-')
}

function bodyType(body) {
    if(body instanceof Object) {
        if(body instanceof Buffer)
            return 'buffer'
        else if(body instanceof Stream)
            return 'stream'
        else
            return 'object'
    }
    else
        return typeof body
}

function jsonToString(obj, env) {
    if(env !== 'production' && env !== 'test')
        return JSON.stringify(obj, null, 4)
    else
        return JSON.stringify(obj)
}

// expose

module.exports = Response
