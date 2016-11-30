'use strict'

require('babel-register')({
    plugins: [ 'transform-async-to-generator' ]
})
require('./errors.es7')
