'use strict'

// expose

var http = require('http')
/**
 * @name Response
 * @extends http.ServerResponse
 * @exports Response
 */
var Response = module.exports = http.ServerResponse

// includes

var assert      = require('assert'),
    Stream      = require('stream'),
    extname     = require('path').extname,
    send        = require('send'),
    destroy     = require('destroy'),
    escape      = require('escape-html'),
    getType     = require('mime-types').contentType,
    disposition = require('content-disposition'),
    extend      = require('./utils/extend'),
    sendfile    = require('./utils/sendFile'),
    isAbsolute  = require('./utils/isAbsolute'),
    isGen       = require('./utils/isGenerator'),
    statusCodes = http.STATUS_CODES

// instance members

var prototype = {
    /**
     * Get the `Context` associated with response.
     *
     * @instance
     * @member ctx
     * @type {Context}
     */
    get ctx() {
        return this._ctx
    },

    /**
     * Get the `Context` associated with this response.
     *
     * @instance
     * @member context
     * @type {Context}
     */
    get context() {
        return this._ctx
    },

    /**
     * Get the request associated with this response.
     *
     * @instance
     * @member req
     * @type {http.IncomingMessage}
     */
    get req() {
        return this._ctx._req
    },

    /**
     * Get the request associated with this response.
     *
     * @instance
     * @member request
     * @type {http.IncomingMessage}
     */
    get request() {
        return this._ctx._req
    },

    /**
     * Get response body.
     *
     * @instance
     * @member body
     * @type {Buffer|Stream|string|object|Array|null|undefined}
     */
    get body() {
        return this._body
    },

    /**
     * Set response body.
     *
     * @instance
     * @member body=
     * @type {Buffer|Stream|string|object|Array|null|undefined}
     */
    set body(value) {
        this._body = value
    },

    /**
     * Get status message of response.
     *
     * @instance
     * @member message
     * @type {string}
     */
    get message() {
        return this.statusMessage || ''
    },

    /**
     * Set status message of response.
     *
     * @instance
     * @member message=
     * @type {string}
     */
    set message(value) {
        assert.equal(typeof value, 'string', 'res.message= must be a string')

        this.statusMessage = value
    },

    /**
     * Get Content-Length header of response.
     *
     * @instance
     * @member length
     * @type {number}
     */
    get length() {
        return +this.get('content-length') || 0
    },

    /**
     * Set Content-Length header of response.
     *
     * @instance
     * @member length=
     * @type {number}
     */
    set length(value) {
        assert.equal(typeof value, 'number', 'res.length= must be a number')

        if (value)
            this.set('content-length', value)
        else
            this.remove('content-length')
    },

    /**
     * Get Last-Modified header as a `Date` instance if present.
     *
     * @instance
     * @member lastModified
     * @type {Date|undefined}
     */
    get lastModified() {
        var date = this.get('last-modified')
        return date ? new Date(date) : undefined
    },

    /**
     * Set Last-Modified header.
     *
     * @instance
     * @member lastModified=
     * @type {Date|string}
     */
    set lastModified(value) {
        if (typeof value === 'string')
            value = new Date(value)

        this.set('last-modified', value.toUTCString())
    },

    /**
     * Get ETag header.
     *
     * @instance
     * @member etag
     * @type {string}
     */
    get etag() {
        return this.get('etag')
    },

    /**
     * Set ETag header.
     *
     * @instance
     * @member etag=
     * @type {string}
     */
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

        if (this.body)
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

/**
 * Sends the HTTP response.
 *
 * @instance
 * @method send
 * @param [body] {Buffer|Stream|string|object|Array|null}
 * @returns {Response}
 */
function respond(body) {
    var env    = this.app.env,
        router = this.router

    body = body || this.body

    if (env === 'development') {
        assert(!(body instanceof Promise), 'response body cannot be a Promise. Did you forget a `yield`?')
        assert(!isGen(body), 'response body cannot be a Generator. Did you forget a `yield*`?')
    }

    var req    = this._ctx._req,
        type   = 'text/html',
        kind   = bodyType(body),
        etag   = this.app.etagFn,
        length = this.length,
        status = this.statusCode || 200

    if (kind === 'number') {
        body += ''
        kind = 'string'
    }
    else if (body !== null && kind === 'object') {
        type = 'application/json'
        body = jsonToString(body, env)
        kind = 'string'
    }
    else if (kind === 'stream' || kind === 'buffer')
        type = 'application/octet-stream'
    else if (kind === 'undefined')
        body = null
    else if (kind === 'boolean')
        body = body.toString()

    if (!length)
        switch (kind) {
            case 'buffer':
                length = body.length
                break

            case 'string':
                length = Buffer.byteLength(body)
                break

            default:
                if (kind !== 'stream')
                    length = 0
        }

    if (!this._type && !this.get('content-type'))
        this.type(type)

    if (!this.length)
        this.length = length || 0

    // we cannot calculate ETag from a stream response,
    // `app.etag` must be set as well to enable ETag calculation
    if (
        kind !== 'stream' &&
        kind !== 'undefined' &&
        etag && !this.etag
    )
        this.etag = etag(body, kind === 'string' ? 'utf8' : null)

    // freshness
    if (status < 400 && req.fresh)
        this.statusCode = status = 304

    // strip irrelevant headers
    if (status === 204 || status === 304) {
        this.remove([ 'content-type', 'content-length', 'content-encoding', 'transfer-encoding' ])
        body = ''
    }

    if (router && router.listenerCount('respond'))
        router.emit('respond', this._ctx, this._ctx._req, this)

    if (body && req.method !== 'HEAD') {
        if (kind === 'stream') {
            body.on('close', function () {
                // destroy target stream to prevent fd leaks
                destroy(body)
            })

            // handle stream errors if nobody else does
            if (!body.listenerCount('error')) {
                var next = this.next

                body.once('error', function (err) {
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

/**
 * Sets the HTTP status code.
 *
 * @instance
 * @method status
 * @param code {number} Any valid HTTP status code.
 * @param [message] {string} An optional HTTP status message.
 * @returns {Response}
 */
function setStatus(code, message) {
    assert.equal(typeof code, 'number', 'status code must be number')
    assert(code in statusCodes, 'invalid status code provided: ' + code)

    this.statusCode    = code
    this.statusMessage = message || statusCodes[ code ]
}

/**
 * Sets the Content-Type header of response.
 *
 * @instance
 * @method type
 * @param value {string}
 * @return {Response}
 */
function setType(value) {
    var type = getType(value)

    if (type)
        this.set('content-type', type)
    else
        this.remove('content-type')

    this._type = value
}

/**
 * Gets a response header by name.
 *
 * @instance
 * @method get
 * @param field {string}
 * @returns {string}
 */
function getResponseHeader(field) {
    return this.getHeader(field.toLowerCase()) || ''
}

/**
 * Sets a response header by name.
 *
 * @instance
 * @method set
 * @param field {string}
 * @param value {string}
 * @returns {Response}
 */
function setResponseHeader(field, value) {
    if (field instanceof Object) {
        for (var key in field)
            if (field.hasOwnProperty(key))
                this.setHeader(key.toLowerCase(), field[ key ])
    }
    else
        this.setHeader(field.toLowerCase(), value)
}

/**
 * Appends value to a response header.
 *
 * @instance
 * @method append
 * @param field {string}
 * @param value {string}
 * @returns {Response}
 */
function appendToResponseHeader(field, value) {
    var current = this.get(field)

    if (current)
        value = Array.isArray(current)
            ? current.concat(value)
            : Array.isArray(value)
            ? [ current ].concat(value)
            : [ current, value ]

    return this.set(field, value)
}

/**
 * Removes headers from response.
 *
 * @instance
 * @method remove
 * @param field {string|Array}
 * @returns {Response}
 */
function removeResponseHeader(field) {
    var res = this

    if (Array.isArray(field))
        field.forEach(function (f) {
            res.removeHeader(f.toLowerCase())
        })
    else
        res.removeHeader(field.toLowerCase())
}

/**
 * Sets Content-Type header to `application/json` and send response.
 *
 * @instance
 * @method json
 * @param body {object|string}
 * @returns {Response}
 */
function respondWithJson(body) {
    this.type('application/json')
    this.body = jsonToString(body, this.app.env)
    this.send()
}

/**
 * Sets Content-Type header to `text/html` and send response.
 *
 * @instance
 * @method html
 * @param body {string}
 * @returns {Response}
 */
function respondWithHtml(body) {
    this.type('text/html')
    this.send(body)
}

/**
 * Redirects to the URL derived from the specified path.
 *
 * @instance
 * @param url
 * @returns {Response}
 */
function redirect(url) {
    this.set('location', url)
    this.status  = 302
    this.message = statusCodes[ 302 ]

    if (this.req.accepts('text/html')) {
        url = escape(url)
        this.type = 'text/html'
        this.body = '<p>Redirecting to <a href="' + url + '">' + url + '</a>.</p>'
    }
    else {
        this.type = 'text/plain'
        this.body = 'Redirecting to ' + encodeURI(url) + '.'
    }

    this.send()
}

/**
 * Sets Content-Disposition header to `attachment`. If a filename is given then set Content-Type as well.
 *
 * @instance
 * @param fileName {string}
 * @returns {Response}
 */
function attachment(fileName) {
    if (fileName)
        this.type(extname(fileName))

    this.set('content-disposition', disposition(fileName))
}

/**
 * Transfers the file at path as an `attachment`.
 *
 * @instance
 * @param fileName
 * @param options
 * @param callback
 * @returns {http.ServerResponse}
 */
function download(fileName, options, callback) {
    this.attachment(fileName)
        .sendFile(fileName, options, callback)
}

/**
 * Sets a cookie.
 *
 * @instance
 * @method cookie
 * @param name {string}
 * @param value {string}
 * @param [options] {{}}
 * @returns {http.ServerResponse}
 */
function setCookie(name, value, options) {
    this._ctx.cookies.set(name, value, options)
}

/**
 * Removes a previously set cookie.
 *
 * @instance
 * @param name
 * @param [options] {{}}
 * @returns {http.ServerResponse}
 */
function clearCookie(name, options) {
    var opts = extend({ expires: new Date(1), path: '/' }, options)
    this._ctx.cookies.set(name, '', opts)
}

/**
 * Responds request with a file.
 * Ported from Express (https://github.com/strongloop/express)
 *
 * @instance
 * @param path {string} File path
 * @param [options] {object} An object containing options
 * @param [callback]
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

require('./utils/define')(descriptor)
('get', getResponseHeader)
('set', setResponseHeader, true)
('send', respond, true)
('json', respondWithJson, true)
('html', respondWithHtml, true)
('type', setType, true)
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
