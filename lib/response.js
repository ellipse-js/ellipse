/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

var http        = require('http'),
    assert      = require('assert'),
    Stream      = require('stream'),
    extname     = require('path').extname,
    send        = require('send'),
    destroy     = require('destroy'),
    onFinished  = require('on-finished'),
    escapeHtml  = require('escape-html'),
    getType     = require('mime-types').contentType,
    disposition = require('content-disposition'),
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

    code: {
        get: function () {
            return this.statusCode || 200
        },

        set: function (value) {
            assert.equal(typeof value, 'number', 'res.code= must be a number')
            assert(value in statusCodes, 'invalid code code: ' + value)

            this.statusCode = value
        }
    },

    message: {
        get: function () {
            return this.statusMessage || ''
        },
        
        set: function (value) {
            assert.equal(typeof value, 'string', 'res.message= must be a string')

            this.statusMessage = value
        }
    },

    type: {
        get: function () {
            return this.get('content-type')
        },

        set: function (value) {
            var type = getType(value)

            if(type)
                this.set('content-type', type)
            else
                this.remove('content-type')
        }
    },

    length: {
        get: function () {
            return +this.get('content-length') || 0
        },

        set: function (value) {
            assert.equal(typeof value, 'number', 'res.length= must be a number')

            if(value)
                this.set('content-length', value)
            else
                this.remove('content-length')
        }
    },

    lastModified: {
        get: function () {
            var date = this.get('last-modified')
            return date ? new Date(date) : undefined
        },

        set: function (value) {
            if (typeof value === 'string')
                value = new Date(value)

            this.set('last-modified', value.toUTCString())
        }
    },

    etag: {
        get: function () {
            return this.get('etag')
        },

        set: function (value) {
            if (!/^(W\/)?"/.test(value))
                value = '"' + value + '"'

            this.set('etag', value)
        }
    },

    toJSON: {
        value: function toJSON() {
            return {
                status:  this.statusCode,
                message: this.statusMessage || '',
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

    var type   = 'text/html',
        kind   = bodyType(body),
        etag   = this.app._etagFn,
        length = this.length,
        status = this.statusCode || 200

    if(kind === 'number') {
        body += ''
        kind  = 'string'
    }
    else if(kind === 'object') {
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

    if(!this.type)
        this.type = type

    if(!this.length)
        this.length = length || 0

    // we cannot calculate ETag from a stream response,
    // `app.etag` must be set as well to enable ETag calculation
    if(!(body instanceof Stream) && etag && !this.etag)
        this.etag = etag(body, kind === 'string' ? 'utf8' : null)

    // freshness
    if (this.req.fresh)
        this.statusCode = status = 304

    // strip irrelevant headers
    if (status === 204 || status === 304) {
        this.remove('content-type')
            .remove('content-length')
            .remove('content-encoding')
            .remove('transfer-encoding')

        body = ''
    }

    if(body && this.req.method !== 'HEAD') {
        if(kind === 'stream') {
            onFinished(this, function () {
                // destroy target stream to prevent fd leaks
                destroy(body)
            })

            // handle stream errors if needed
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
    return this.getHeader(field.toLowerCase()) || ''
})

('set', function (field, value) {
    if(field instanceof Object) {
        for (var key in field)
            if (field.hasOwnProperty(key))
                this.setHeader(key.toLowerCase(), field[ key ])
    }
    else
        this.setHeader(field.toLowerCase(), value)
}, true)

('remove', function remove(field) {
    this.removeHeader(field.toLowerCase())
}, true)

('json', function (body) {
    this.type = 'application/json'
    this.body = jsonToString(body, this.app.env)
    this.send()
}, true)

('html', function html(body) {
    this.type = 'text/html'
    this.send(body)
}, true)

('redirect', function redirect(url) {
    var message = statusCodes[ 302 ],
        accepts = this.req.accepts('text/plain', 'text/html')

    if(accepts)
        this.type = accepts

    switch (accepts) {
        case 'text/plain':
            this.body = message + '. Redirecting to ' + encodeURI(url)
            break

        case 'text/html':
            var u = escapeHtml(url)
            this.body = '<p>' + message + '. Redirecting to <a href="' + u + '">' + u + '</a></p>'
            break

        default:
            this.body = ''
    }

    this.status(302, message)
        .set('location', url)
        .send()
}, true)

('attachment', function attachment(fileName) {
    if (fileName)
        this.type = extname(fileName)

    this.set('Content-Disposition', disposition(fileName))
}, true)

('download', function download(fileName, options, callback) {
    this.attachment(fileName)
        .sendFile(fileName, options, callback)
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
    assert(path, 'path argument is required to res.sendFile')

    var done = callback,
        abs  = isAbsolute(path),
        req  = this.req,
        res  = this,
        next = this.next,
        root = this.app.root,
        opts = options || {}

    // support function as second arg
    if (options instanceof Function) {
        done = options
        opts = {}
    }

    if (!abs && !opts.root)
        opts.root = root

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
    if(typeof obj === 'string')
        return obj
    else if(env === 'development')
        return JSON.stringify(obj, null, 4)
    else
        return JSON.stringify(obj)
}

// expose

module.exports = Response
