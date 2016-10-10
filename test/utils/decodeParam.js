'use strict'

const test    = require('tap'),
      decode  = require('../../lib/utils/decodeParam'),
      encoded = '%21%23%24%26%27%28%29%2A%2B%2C%2F%3A%3B%3D%3F%40%5B',
      ref     = {}

test.plan(5)

test.equals(ref, decode(ref), 'non-string value should be returned untouched')
test.equals('', decode(''), 'empty string should be reurned untouched')
test.equals("!#$&'()*+,/:;=?@[", decode(encoded), 'param should be decoded')

try {
    decode('%0')
}
catch (ex) {
    test.type(ex, Error, 'an error should be thrown')
    test.equals(ex.status, 400, 'status code should be set')
}
