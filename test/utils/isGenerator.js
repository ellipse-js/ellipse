'use strict'

const test  = require('tap'),
      isGen = require('../../lib/utils/isGenerator')

function fn() {}
function *gen() {}

test.notOk(isGen({}), 'irrelevan values should be ignored')
test.notOk(isGen.isFunction(fn), 'classic function should be recognised')
test.ok(isGen(gen()), 'generator generator should be recognised')
test.ok(isGen.isFunction(gen), 'generator function should be recognised')
