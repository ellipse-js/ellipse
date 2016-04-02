/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

// expose

var http     = require('http'),
    Response = module.exports = http.ServerResponse

// includes

var assert        = require('assert'),
    Stream        = require('stream'),
    extname       = require('path').extname,
    extend        = require('util')._extend,
    send          = require('send'),
    destroy       = require('destroy'),
    escapeHtml    = require('escape-html'),
    getType       = require('mime-types').contentType,
    disposition   = require('content-disposition'),
    sendfile      = require('./utils/sendFile'),
    listenerCount = require('./utils/listenerCount'),
    isAbsolute    = require('./utils/isAbsolute'),
    statusCodes   = http.STATUS_CODES

// instance members

var prototype = {
    get ctx() {
        return this._ctx
    },

    get context() {
        return this._ctx
    },

    get req() {
        return this._ctx._req
    },

    get request() {
        return this._ctx._req
    },

    get body() {
        return this._body
    },

    set body(value) {
        this._body = value
    },

    get code() {
        return this.statusCode || 200
    },

    set code(value) {
        assert.equal(typeof value, 'number', 'res.code= must be a number')
        assert(value in statusCodes, 'invalid code code: ' + value)

        this.statusCode = value
    },

    set status(value) {
        this.code = value
    },

    get status() {
        return this.code
    },

    get message() {
        return this.statusMessage || ''
    },

    set message(value) {
        assert.equal(typeof value, 'string', 'res.message= must be a string')

        this.statusMessage = value
    },

    get type() {
        return this.get('content-type')
    },

    set type(value) {
        var type = getType(value)

        if(type)
            this.set('content-type', type)
        else
            this.remove('content-type')
    },

    get length() {
        return +this.get('content-length') || 0
    },

    set length(value) {
        assert.equal(typeof value, 'number', 'res.length= must be a number')

        if(value)
            this.set('content-length', value)
        else
            this.remove('content-length')
    },

    get lastModified() {
        var date = this.get('last-modified')
        return date ? new Date(date) : undefined
    },

    set lastModified(value) {
        if (typeof value === 'string')
            value = new Date(value)

        this.set('last-modified', value.toUTCString())
    },

    get etag() {
        return this.get('etag')
    },

    set etag(value) {
        if (!/^(W\/)?"/.test(value))
            value = '"' + value + '"'

        this.set('etag', value)
    },

    toJSON: function toJSON() {
        return {
            status:  this.statusCode,
            message: this.statusMessage || '',
            headers: this.headers
        }
    },

    inspect: function inspect() {
        var result = this.toJSON()

        if(this.body)
            result.body = this.body

        return result
    }
}

// inherit

var descriptor = {}

Object
    .getOwnPropertyNames(prototype)
    .forEach(function (name) {
        descriptor[ name ] = Object.getOwnPropertyDescriptor(prototype, name)
    })

// methods

function respond(body) {
    body = body || this.body

    var req    = this._ctx._req,
        type   = 'text/html',
        kind   = bodyType(body),
        etag   = this.app.etagFn,
        length = this.length,
        status = this.statusCode || 200

    if (kind === 'number') {
        body += ''
        kind  = 'string'
    }
    else if (body !== null && kind === 'object') {
        type = 'application/json'
        body = jsonToString(body, this.app.env)
        kind = 'string'
    }
    else if (kind === 'stream' || kind === 'buffer')
        type = 'application/octet-stream'
    else if (kind === 'undefined')
        body = null

    if (!length)
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

    if (!this.type)
        this.type = type

    if (!this.length)
        this.length = length || 0

    // we cannot calculate ETag from a stream response,
    // `app.etag` must be set as well to enable ETag calculation
    if (
        body !== null &&
        kind !== 'undefined' &&
        etag && !this.etag
    )
        this.etag = etag(body, kind === 'string' ? 'utf8' : null)

    // freshness
    if (req.fresh)
        this.statusCode = status = 304

    // strip irrelevant headers
    if (
        status === 204 ||
        status === 304
    ) {
        this.remove('content-type')
            .remove('content-length')
            .remove('content-encoding')
            .remove('transfer-encoding')

        body = ''
    }

    if (body && req.method !== 'HEAD') {
        if (kind === 'stream') {
            body.on('close', function () {
                // destroy target stream to prevent fd leaks
                destroy(body)
            })

            // handle stream errors if nobody else does
            if (!listenerCount(body, 'error')) {
                var next = this.next

                body.on('error', function onError(err) {
                    body.removeListener('error', onError)
                    destroy(body)
                    next(err)
                })
            }

            body.pipe(this)
        }
        else
            this.end(body)
    }
    else
        this.end()
}

function setStatus(code, message) {
    this.statusCode    = code
    this.statusMessage = message || statusCodes[ code ]
}

function getResponseHeader(field) {
    return this.getHeader(field.toLowerCase()) || ''
}

function setResponseHeader(field, value) {
    if(field instanceof Object) {
        for (var key in field)
            if (field.hasOwnProperty(key))
                this.setHeader(key.toLowerCase(), field[ key ])
    }
    else
        this.setHeader(field.toLowerCase(), value)
}

function appendToResponseHeader(field, value) {
    var current = this.get(field)

    if (current)
        value = Array.isArray(current)
            ? current.concat(value)
            : Array.isArray(value)
            ? [current].concat(value)
            : [current, value ]

    return this.set(field, value)
}

function removeResponseHeader(field) {
    this.removeHeader(field.toLowerCase())
}

function respondWithJson(body) {
    this.type = 'application/json'
    this.body = jsonToString(body, this.app.env)
    this.send()
}

function respondWithHtml(body) {
    this.type = 'text/html'
    this.send(body)
}

function redirect(url) {
    var message = statusCodes[ 302 ],
        accepts = this.req.accepts('text/plain', 'text/html')

    if (accepts)
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
}

function attachment(fileName) {
    if (fileName)
        this.type = extname(fileName)

    this.set('content-disposition', disposition(fileName))
}

function download(fileName, options, callback) {
    this.attachment(fileName)
        .sendFile(fileName, options, callback)
}

function setCookie(name, value, options) {
    this.ctx.cookies.set(name, value, options)
}

function clearCookie(name, options) {
    var opts = extend({ expires: new Date(1), path: '/' }, options)
    return this.cookie(name, '', opts)
}

/**
 * Respond request with a file.
 * Ported from Express (https://github.com/strongloop/express)
 *
 * @param path {string} File path
 * @param options {object} An object containing options
 * @param callback
 */
function sendFile(path, options, callback) {
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
}

// utils

function bodyType(body) {
    if (body instanceof Object) {
        if (body instanceof Buffer)
            return 'buffer'
        else if (body instanceof Stream)
            return 'stream'
        else
            return 'object'
    }
    else
        return typeof body
}

function jsonToString(obj, env) {
    if (typeof obj === 'string')
        return obj
    else if (env === 'development')
        return JSON.stringify(obj, null, 4)
    else
        return JSON.stringify(obj)
}

// aliases

require('./utils/defineMethod')(descriptor)

('get', getResponseHeader)
('set', setResponseHeader, true)
('send', respond, true)
('json', respondWithJson, true)
('html', respondWithHtml, true)
('status', setStatus, true)
('append', appendToResponseHeader, true)
('remove', removeResponseHeader, true)
('sendFile', sendFile, true)
('redirect', redirect, true)
('download', download, true)
('attachment', attachment, true)
('cookie', setCookie, true)
('clearCookie', clearCookie, true)

// extend `Response` proto
Object.defineProperties(Response.prototype, descriptor)
