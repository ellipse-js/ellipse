'use strict'

// node emits this warning by mistake, silence it
process.on('unhandledRejection', () => {})

require('babel-register')({
    plugins: [ 'transform-async-to-generator' ]
})
require('./async.es7')
