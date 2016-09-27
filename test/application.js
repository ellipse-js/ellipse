'use strict'

const AE      = require('assert').AssertionError,
      root    = require('path').resolve('.'),
      test    = require('tap'),
      Ellipse = require('../'),
      env     = process.env.NODE_ENV || 'development'

var app = new Ellipse

// todo: what about app.keys?

test.test('properties & getters', test => {
    test.equal(app, app.application, 'application reference should be exposed')
    test.equal(app, app.router, 'application itself should be its own router')
    test.equal(app.subdomainOffset, 2, 'app.subdomainOffset should default to 2')
    test.equal(app.etag, 'weak', 'app.etag should default to weak')
    test.equal(app.env, env, 'app.env should default to `NODE_ENV` or development')
    test.equal(app.root, root, 'app.root should default to the fullpath of cwd')
    test.equal(app.xPoweredBy, 'Ellipse/' + require('../package.json').version, 'app.xPoweredBy should default to "Ellipse/version"')
    test.strictEqual(app.respond, true, 'app.respond should default to true')
    test.strictEqual(app.proxy, false, 'app.proxy should default to false')
    test.type(app.listen, 'function', 'app should have a listen() method')
    test.type(app.toJSON, 'function', 'app should have a toJSON() method')
    test.type(app.inspect, 'function', 'app should have an inspect() method')
    const json = {
        subdomainOffset: 2,
        proxy: false,
        etag: 'weak',
        root: root,
        env: env
    }
    test.same(app.toJSON(), json, 'application should have a correct json representation')
    test.same(app.toJSON(), app.inspect(), 'toJSON() and inspect() should have the same output')
    test.end()
})

test.test('setters', test => {
    test.test('app.etag', test => {
        function etag() {}

        test.doesNotThrow(() => {
            app.etag = 'strong'
        }, 'app.etag should be set to strong')
        test.doesNotThrow(() => {
            app.etag = 'weak'
        }, 'app.etag should be set to weak')
        test.doesNotThrow(() => {
            app.etag = false
        }, 'app.etag should be disabled')
        test.doesNotThrow(() => {
            app.etag = true
        }, 'app.etag should be re-enabled')
        test.doesNotThrow(() => {
            app.etag = etag
        }, 'app.etag should be a custom function')
        test.throws(() => {
            app.etag = 'invalid'
        }, TypeError, 'app.etag should not accept invalid values')
        test.equal(app.etag, etag, 'value for app.etag should persist')

        test.end()
    })

    test.test('app.subdomainOffset', test => {
        test.doesNotThrow(() => {
            app.subdomainOffset = 0
        }, 'app.subdomainOffset should be set zero')
        test.doesNotThrow(() => {
            app.subdomainOffset = 42
        }, 'app.subdomainOffset should be set to any positive integer')
        test.throws(() => {
            app.subdomainOffset = -1
        }, AE, 'app.subdomainOffset should not accept negative numbers')
        test.throws(() => {
            app.subdomainOffset = 4.2
        }, AE, 'app.subdomainOffset should only accept integers')
        test.throws(() => {
            app.subdomainOffset = true
        }, AE, 'app.subdomainOffset should only accept numbers')
        test.equal(app.subdomainOffset, 42, 'value for app.subdomainOffset should persist')

        test.end()
    })

    test.test('app.env', test => {
        test.doesNotThrow(() => {
            app.env = 'test'
        }, 'app.test should be set to any string')
        test.throws(() => {
            app.env = true
        }, AE, 'app.env should only accept strings')
        test.throws(() => {
            app.env = ''
        }, AE, 'app.env should not accept empty strings')
        test.equals(app.env, 'test', 'value for app.env should persist')

        test.end()
    })

    test.test('app.root', test => {
        test.doesNotThrow(() => {
            app.root = '.'
        }, 'app.root should be set to a path')
        test.throws(() => {
            app.root = true
        }, AE, 'app.root should only accept strings')
        test.throws(() => {
            app.root = ''
        }, AE, 'app.root should not accept empty strings')
        test.equals(app.root, root, 'value for app.root should be resolved and stored')

        test.end()
    })

    test.test('app.xPoweredBy', test => {
        test.doesNotThrow(() => {
            app.xPoweredBy = true
        }, 'app.xPoweredBy should be enabled')
        test.doesNotThrow(() => {
            app.xPoweredBy = false
        }, 'app.xPoweredBy should be disabled')
        test.doesNotThrow(() => {
            app.xPoweredBy = 'org'
        }, 'app.xPoweredBy should be overridden')
        test.throws(() => {
            app.xPoweredBy = {}
        }, TypeError, 'app.xPoweredBy should only accept strings')
        test.throws(() => {
            app.xPoweredBy = ''
        }, TypeError, 'app.xPoweredBy should only accept non-empty strings')
        test.equals(app.xPoweredBy, 'org', 'value for app.xPoweredBy should persist')

        test.end()
    })

    test.test('app.respond', test => {
        test.doesNotThrow(() => {
            app.respond = {}
        }, 'app.respond should be set to any truthy value')
        test.doesNotThrow(() => {
            app.respond = null
        }, 'app.respond should be set to any falsy value')
        test.strictEquals(app.respond, false, 'value for app.respond should default to `false` when it\' disabled')

        test.end()
    })

    test.end()
})

test.test('constructor options', test => {
    app = new Ellipse({
        env: 'test',
        respond: false,
        xPoweredBy: 'community'
    })

    test.strictEquals(app.env, 'test', 'options should be accepted by constructor')
    test.strictEquals(app.respond, false, 'options should be accepted by constructor')
    test.strictEquals(app.xPoweredBy, 'community', 'options should be accepted by constructor')

    test.end()
})
