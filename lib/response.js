'use strict'

// expose

const http = require('http')

/**
 * @name Response
 * @extends http.ServerResponse
 * @exports Response
 */
const Response = module.exports = http.ServerResponse

// includes

const assert        = require('assert'),
      Stream        = require('stream'),
      statuses      = http.STATUS_CODES,
      extname       = require('path').extname,
      send          = require('send'),
      vary          = require('vary'),
      mime          = require('mime'),
      destroy       = require('destroy'),
      escape        = require('escape-html'),
      encodeUrl     = require('encodeurl'),
      contentType   = require('content-type'),
      disposition   = require('content-disposition'),
      extend        = require('./utils/extend'),
      sendfile      = require('./utils/sendFile'),
      isAbsolute    = require('./utils/isAbsolute'),
      charsetRegExp = /;\s*charset\s*=/,
      setHeader     = Response.prototype.setHeader,
      getHeader     = Response.prototype.getHeader,
      removeHeader  = Response.prototype.removeHeader

// instance members

const prototype = {
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
     * Get the parent application associated with this request.
     *
     * @instance
     * @member app
     * @type {Application}
     */
    get app() {
        return this.router.app
    },

    /**
     * Get the parent application associated with this request.
     *
     * @instance
     * @member application
     * @type {Application}
     */
    get application() {
        return this.app
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
     * Get implicit headers.
     *
     * @instance
     * @member headers
     * @type {object}
     */
    get headers() {
        return this._headers
    },

    /**
     * Get Content-Length header of response.
     *
     * @instance
     * @member length
     * @type {number}
     */
    get length() {
        const value = this.get('content-length')

        if (value === undefined)
            return null
        else
            return +value
    },

    /**
     * Set Content-Length header of response.
     *
     * @instance
     * @member length=
     * @type {number}
     */
    set length(value) {
        assert(value === null || typeof value === 'number', 'res.length= must be a number or null')

        if (value !== null)
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
        const date = this.get('last-modified')
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
        // falsy values are meaningless, ignore them
        if (!value) return

        if (!/^(W\/)?"/.test(value))
            value = '"' + value + '"'

        this.set('etag', value)
    },

    'catch': function (err) {
        this.router.onerror(this.ctx, err)
        return this // allow chaining
    },

    toJSON: function toJSON() {
        const result =  {
            status:  this.statusCode,
            message: this.statusMessage || '',
            headers: this.headers
        }

        if (this.body)
            result.body = this.body

        return result
    },

    inspect: function inspect() {
        return this.toJSON()
    }
}

// inherit

const descriptor = {}

Object
    .getOwnPropertyNames(prototype)
    .forEach(n => descriptor[ n ] = Object.getOwnPropertyDescriptor(prototype, n))

/**
 * Send the response.
 *
 * @param {Buffer|Stream|string|object|Array|null} [body]
 * @return {Response}
 */
function respond(body) {
    // implicit body
    if (body === undefined)
        body = this.body

    // status response
    if (body === null)
        body = ''

    const req  = this._ctx._req,
          etag = this.app.etagFn

    let type   = 'text/html',
        kind   = bodyType(body),
        length = this.length,
        status = this.statusCode || 200,
        encoding

    if (kind === 'number') {
        body += ''
        kind = 'string'
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
    else if (kind === 'boolean')
        body = body.toString()

    if (!length)
        switch (kind) {
            case 'buffer':
            case 'boolean':
                length = body.length
                break

            case 'string':
                length = Buffer.byteLength(body)
                break

            default:
                if (kind !== 'stream')
                    length = 0
        }

    // set content type if not already set
    if (!this.get('content-type'))
        this.type(type)

    // write strings in utf-8
    if (kind === 'string') {
        encoding = 'utf8'
        this.charset('utf-8')
    }

    if (this.length === null && length !== null)
        this.length = length

    // we cannot calculate ETag from a stream response and
    // `app.etag` must be set to enable ETag calculation
    if (
        kind !== 'stream' &&
        kind !== 'undefined' &&
        etag && !this.etag
    )
        this.etag = etag(body, encoding)

    // freshness
    if (status < 400 && req.fresh)
        this.statusCode = status = 304

    // strip irrelevant headers
    if (status === 204 || status === 304) {
        this.remove([ 'content-type', 'content-length', 'content-encoding', 'transfer-encoding' ])
        body = ''
    }

    this.router.emit('respond', this._ctx)

    if (body && req.method !== 'HEAD') {
        if (kind === 'stream') {
            if (this._streaming)
                return // already piped
            else
                this._streaming = true

            // destroy target stream to prevent fd leaks
            body.once('close', () => destroy(body))

            // handle stream errors if nobody else does
            if (!body.listenerCount('error'))
                body.once('error', err => {
                    destroy(body)
                    this.ctx.catch(err)
                })

            body.pipe(this)
        }
        else
            this.end(body, encoding)
    }
    else
        this.end()
}

/**
 * Set response status code.
 *
 * @param {number} code Any valid HTTP status code.
 * @param {string} [message] An optional HTTP status message.
 * @return {Response}
 */
function setStatus(code, message) {
    this.statusCode = code

    if (message)
        this.statusMessage = message
}

/**
 * Set the Content-Type header of response.
 *
 * @param {string} value
 * @return {Response}
 */
function setType(value) {
    if (value) {
        const type = value.includes('/')
            ? value
            : mime.lookup(value)

        this.set('Content-Type', type)
    }
    else
        this.remove('content-type')
}

/**
 * Set one or more response headers.
 *
 * @param {string|object} field
 * @param {string} value
 * @return {Response}
 */
function setResponseHeader(field, value) {
    if (typeof field === 'object')
        Object.keys(field).forEach(k =>
            setResponseHeader.call(this, k, field[ k ]))
    else {
        const val = Array.isArray(value)
            ? value.map(String)
            : String(value)

        // add charset to content-type
        if (field.toLowerCase() === 'content-type' && !charsetRegExp.test(value)) {
            const charset = mime.charsets.lookup(mime.lookup(value))

            if (charset)
                this.charset(charset)
        }

        setHeader.call(this, field, val)
    }
}

/**
 * Append one or more values to a response header.
 *
 * @param {string} field
 * @param {string|Array} value
 * @return {Response}
 */
function appendToResponseHeader(field, value) {
    const current = this.get(field)

    if (current)
        value = Array.isArray(current)
            ? current.concat(value)
            : Array.isArray(value)
            ? [ current ].concat(value)
            : [ current, value ]

    return this.set(field, value)
}

/**
 * Remove one or more header from response.
 *
 * @param {string|Array} field
 * @return {Response}
 */
function removeResponseHeader(field) {
    if (Array.isArray(field))
        field.forEach(f => removeHeader.call(this, f))
    else
        removeHeader.call(this, field)
}

/**
 * Set Content-Type header to `application/json` and send response.
 *
 * @param {object|string} body
 * @return {Response}
 */
function respondWithJson(body) {
    if (!this.get('content-type'))
        this.type('application/json')

    this.body = jsonToString(body, this.app.env)
    this.send()
}

/**
 * Set Content-Type header to `text/html` and send response.
 *
 * @method html
 * @param {string} body
 * @return {Response}
 */
function respondWithHtml(body) {
    if (!this.get('content-type'))
        this.type('text/html')

    this.send(body)
}

/**
 * Redirect to URL derived from the specified path.
 *
 * @param {string} url
 * @return {Response}
 */
function redirect(status, url, alt) {
    if (typeof status === 'string') {
        alt    = url
        url    = status
        status = 302
    }

    if (url === 'back')
        url = this.req.get('referrer') || alt || '/'

    this.location(url)
        .status(status)

    if (this.req.accepts('text/html')) {
        url = escape(url)
        this.type('text/html')
        this.body = `<p>${statuses[ status ]}. Redirecting to <a href="${url}">${url}</a>.</p>`
    }
    else {
        this.type('text/plain')
        this.body = `${statuses[ status ]}. Redirecting to ${url}.`
    }

    this.send()
}

/**
 * Set Content-Disposition header to `attachment`.
 * If a filename is given then set Content-Type as well.
 *
 * @param {string} fileName
 * @return {Response}
 */
function attachment(fileName) {
    if (fileName)
        this.type(extname(fileName))

    this.set('content-disposition', disposition(fileName))
}

/**
 * Transfer file at path as an attachment.
 *
 * @param {string} path
 * @param {object|string} [options] An object containing options for .sendFile() or the attachment's filename.
 * @param callback
 * @return {Response}
 */
function download(path, options, callback) {
    switch (typeof options) {
        case 'function':
            callback = options
            options  = {}
            break

        case 'string':
            var fileName = options
            options = {}
            break

        case 'object':
            // typeof null === 'object'
            if (options && options.fileName)
                fileName = options.fileName
            break

        case 'undefined':
            options = {}
            break

        default:
            throw new TypeError('invalid options argument provided')
    }

    if (!fileName)
        fileName = path

    // set mime-type
    // this.type(extname(fileName))
    // enurse `headers` object
    options.headers = options.headers || {}
    // set attachment header
    options.headers[ 'content-disposition' ] = disposition(fileName)
    // transfer file
    return this.sendFile(path, options, callback)
}

/**
 * Set a cookie.
 *
 * @param {string} name
 * @param {string} value
 * @param {object} [options]
 * @return {Response}
 */
function setCookie(name, value, options) {
    value = typeof value === 'object'
        ? 'j:' + JSON.stringify(value)
        : String(value)

    this._ctx.cookies.set(name, value, options)
}

/**
 * Remove a cookie.
 *
 * @param {string} name
 * @param {object} [options]
 * @return {http.ServerResponse}
 */
function clearCookie(name, options) {
    const opts = extend({ expires: new Date(1), path: '/' }, options || {})
    this._ctx.cookies.set(name, '', opts)
}

/**
 * Respond with an empty body and the provided status code.
 */
function sendStatus(code) {
    const body = statuses[ code ] || code.toString()

    this.status(code)
        .send(body)
}

/**
 * Respond request with file at path.
 * Ported from Express (https://github.com/strongloop/express)
 *
 * @param {string} path File path
 * @param {object} [options] An object containing options
 * @param [callback]
 * @return {Promise}
 */
function sendFile(path, options, callback) {
    const res  = this,
          req  = this.req,
          root = this.app.root

    let done = callback,
        opts = options || {}

    // support function as second arg
    if (typeof options === 'function') {
        done = options
        opts = {}
    }

    this.ctx.respond = false

    return new Promise((resolve, reject) => {
        assert(path, 'path argument is required for res.sendFile()')

        if (!isAbsolute(path) && !opts.root)
            opts.root = root

        // create file stream
        const pathname = encodeURI(path),
              file     = send(req, pathname, opts)

        // transfer
        sendfile(res, file, opts, err => {
            // todo: why Express does this?
            // if (err && err.code === 'EISDIR')
            //     return resolve()

            // next() all but write errors
            if (err && err.code !== 'ECONNABORTED' && err.syscall !== 'write')
                reject(err)
            else
                resolve()
        })
    })
    .then(() => {
        if (done)
            done()
    })
    .catch(err => {
        if (done)
            return done(err)

        this.ctx.catch(err)
        throw err
    })
}

/**
 * Manipulate the HTTP Vary header.
 *
 * @param {string} field
 * @return {Response}
 */
function setVaryHeader(field) {
    vary(this, field)
}

/**
 * Set Link header field with the given `links`.
 *
 * @param {string|object} links
 * @param {string} [rel]
 * @return {Response}
 */
function setLinkHeader(links, href) {
    let link = this.get('link') || ''

    if (link)
        link += ', '

    if (typeof links === 'object')
        link += Object
            .keys(links)
            .map(r => `<${links[ r ]}>; rel="${r}"`)
            .join(', ')
    else
        link += `<${href}>; rel="${links}"`

    return this.set('link', link)
}

/**
 * Set the location header to `url`.
 *
 * @param {string} url
 */
function setLocationHeader(url) {
    // "back" is an alias for the referrer
    if (url === 'back')
        url = this.req.get('referrer') || '/'

    // set location
    return this.set('location', encodeUrl(url))
}

function setCharset(value) {
    const parsed = contentType.parse(this.get('content-type') || 'text/html')
    parsed.parameters.charset = value.toLowerCase()
    this.type(contentType.format(parsed))
}

/**
 * Warn user about missing format() method.
 */
 function format() {
     throw new Error(
         'res.format() is not implemented, ' +
         'use context.accepts() and a switch statement insted'
         // todo: add docs link
     )
 }

 /**
  * Warn user about missing jsonp() method.
  */
  function jsonp() {
      throw new Error(
          'res.jsonp() is not implemented. ' +
          'Ellipse core does not include JSONP support.'
          // todo: mention `ellipse-jsonp` module, when that will exist
      )
  }

/**
 * Determine type of response body.
 */
function bodyType(body) {
    const type = typeof body

    if (type === 'object') {
        if (body instanceof Buffer)
            return 'buffer'
        else if (body instanceof Stream)
            return 'stream'
        else
            return type
    }
    else
        return type
}

/**
 * Stringify JSON, like JSON.stringify() depending on app.env - v8 optimized.
 */
function jsonToString(obj, env) {
    if (env === 'development')
        return JSON.stringify(obj, null, 4)
    else
        // v8 checks arguments.length for optimizing simple call
        // https://bugs.chromium.org/p/v8/issues/detail?id=4730
        return JSON.stringify(obj)
}

// define methods and aliases
require('./utils/define')(descriptor)
('get', getHeader)
('set', setResponseHeader, true)
('header', setResponseHeader, true)
('setHeader', setResponseHeader, true)
('send', respond, true)
('json', respondWithJson, true)
('jsonp', jsonp)
('html', respondWithHtml, true)
('type', setType, true)
('setType', setType, true)
('contentType', setType, true)
('charset', setCharset, true)
('setCharset', setCharset, true)
('status', setStatus, true)
('append', appendToResponseHeader, true)
('remove', removeResponseHeader, true)
('removeHeader', removeResponseHeader, true)
('sendFile', sendFile)
('redirect', redirect, true)
('download', download)
('attachment', attachment, true)
('cookie', setCookie, true)
('setCookie', setCookie, true)
('clearCookie', clearCookie, true)
('vary', setVaryHeader, true)
('link', setLinkHeader, true)
('links', setLinkHeader, true)
('location', setLocationHeader, true)
('format', format, true)
('sendStatus', sendStatus, true)

// extend `Response` proto
Object.defineProperties(Response.prototype, descriptor)
