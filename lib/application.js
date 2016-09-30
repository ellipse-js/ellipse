'use strict'

// expose

module.exports = Ellipse

// includes

const http       = require('http'),
      path       = require('path'),
      util       = require('util'),
      assert     = require('assert'),
      extend     = require('./utils/extend'),
      etag       = require('./utils/ETag'),
      isAbsolute = require('./utils/isAbsolute'),
      Router     = require('./router'),
      req        = require('./request').prototype,
      res        = require('./response').prototype,
      ctx        = require('./context').prototype,
      version    = require('../package.json').version

// constructor

function Ellipse(options) {
    if (!(this instanceof Ellipse))
        return new Ellipse(options)

    Router.call(this)

    this.xPoweredBy = true

    if (options) {
        assert.equal(typeof options, 'object', '`options` must be an object')
        extend(this, options)
    }
}

// utils

function noop() {}

function xpbHandler(req, res, next) {
    res.set('x-powered-by', res.app._xpb)
    next()
}

// instance members

Ellipse.prototype = {
    proxy:  false,
    etagFn: etag(true),

    get app() {
        return this
    },

    get application() {
        return this
    },

    get router() {
        return this
    },

    get etag() {
        return this._etag || 'weak'
    },

    set etag(value) {
        this.etagFn = etag(value) // note: throws if value is invalid
        this._etag  = value
    },

    get subdomainOffset() {
        return this._subdomainOffset || 2
    },

    set subdomainOffset(value) {
        assert.equal(typeof value, 'number', 'app.subdomainOffset= should be a number')
        assert.equal(value % 1, 0, 'app.subdomainOffset= should be an integer')
        assert(value >= 0, 'app.subdomainOffset= should be positive')

        this._subdomainOffset = value
    },

    get env() {
        return this._env || process.env.NODE_ENV || 'development'
    },

    set env(value) {
        assert.equal(typeof value, 'string', 'app.env= must be string')
        assert(value.length, 'app.env= cannot be an empty string')

        this._env = value
    },

    get response() {
        return this._res || (this._res = Object.setPrototypeOf({}, res))
    },

    get request() {
        return this._req || (this._req = Object.setPrototypeOf({}, req))
    },

    get context() {
        return this._ctx || (this._ctx = Object.setPrototypeOf({}, ctx))
    },

    get root() {
        return this._root || (this._root = path.dirname(require.main.filename))
    },

    set root(value) {
        assert.equal(typeof value, 'string', 'app.root= must be string')
        assert(value.length, 'app.root= cannot be an empty string')
        assert(isAbsolute(value), 'app.root= must be an absolute path')

        this._root = path.resolve(value)
    },

    get xPoweredBy() {
        return this._xpb
    },

    set xPoweredBy(value) {
        if (value === true)
            this._xpb = 'Ellipse/' + version
        else if (value === false) {
            this.removeHandler(xpbHandler)
            this._xpb = null
        }
        else if (typeof value === 'string' && value.length)
            this._xpb = value
        else
            throw new TypeError('invalid value provided for x-powered-by header')

        if (this._xpb)
            this.all(xpbHandler)
    },

    get respond() {
        return this.context.respond || false
    },

    set respond(value) {
        this.context.respond = !!value
    },

    listen: function listen() {
        const server = http.createServer(this.callback())
        return server.listen.apply(server, arguments)
    },

    toJSON: function toJSON() {
        return {
            subdomainOffset: this.subdomainOffset,
            proxy: this.proxy,
            root: this.root,
            etag: this.etag,
            env: this.env
        }
    },

    inspect: function inspect() {
        return this.toJSON()
    },

    _toPromise: function toPromise(executor) {
        if (this.upstream)
            return new Promise(executor)
        else
            executor(noop, noop)
    }
}

// inherit

Object.setPrototypeOf(Ellipse.prototype, Router.prototype)
