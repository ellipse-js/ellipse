/**
 * Created by schwarzkopfb on 15/9/12.
 */

'use strict'

// expose

module.exports = Ellipse

// includes

var http      = require('http'),
    path      = require('path'),
    util      = require('util'),
    assert    = require('assert'),
    extend    = util._extend,
    lazy      = require('./utils/lazy'),
    getETagFn = require('./utils/ETag'),
    Router    = require('./router'),
    res       = require('./response').prototype,
    req       = require('./request').prototype,
    ctx       = require('./context').prototype

// constructor

function Ellipse(options) {
    if(!(this instanceof Ellipse))
        return new Ellipse(options)

    Router.call(this)

    if (options) {
        assert(options instanceof Object, '`options` must be an object')
        extend(this, options)
    }

    // include logger if needed
    if (!options || !('log' in options))
        this.log = 'development'
}

// instance members

Ellipse.prototype = {
    proxy: false,
    etagFn: getETagFn(true),

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
        this._etag  = value
        this.etagFn = getETagFn(value)
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

        this._env = value
    },

    get response() {
        return this._res || (this._res = { __proto__: res })
    },

    get request() {
        return this._req || (this._req = { __proto__: req })
    },

    get context() {
        return this._ctx || (this._ctx = { __proto__: ctx })
    },

    get root() {
        return this._root || (this._root = path.resolve('.'))
    },

    set root(value) {
        assert.equal(typeof value, 'string', 'app.root= must be string')

        this._root = path.resolve(value)
    },

    get log() {
        return this._log // constructor ensures that it's already set
    },

    set log(value) {
        assert(
            value instanceof Function ||
            typeof value === 'boolean' ||
            typeof value === 'string',
            'app.log= must be bool, string or function'
        )

        if (value === true)
            value = this.env

        this._log = value

        // load logger lazily only if needed
        if (
            value === this.env ||
            value instanceof Function
        )
            this.all(
                lazy.logger({ write: value })
            )
        // todo: disable logging if enabled
    },

    listen: function listen() {
        var server = http.createServer(this.callback())
        return server.listen.apply(server, arguments)
    },

    toJSON: function toJSON() {
        return {
            subdomainOffset: this.subdomainOffset,
            proxy:           this.proxy,
            root:            this.root,
            etag:            this.etag,
            env:             this.env
        }
    },

    inspect: function inspect() {
        return this.toJSON()
    }
}

// inherit

Object.setPrototypeOf(Ellipse.prototype, Router.prototype)
