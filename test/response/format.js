'use strict'

require('babel-register')({
    plugins: [ 'transform-async-to-generator' ]
})
require('./format.es7')
