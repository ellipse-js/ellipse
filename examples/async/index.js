'use strict'

// `npm i babel-register babel-plugin-transform-async-to-generator`

require('babel-register')({
    plugins: [ 'transform-async-to-generator' ]
})
require('./index.es7')
