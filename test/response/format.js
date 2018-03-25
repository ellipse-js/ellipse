'use strict'

// detect native support for async functions
try {
    eval('async function supported() {}')
}
catch (ex) {
    // not supported, we need to transpile
    require('babel-register')({
        plugins: [ 'transform-async-to-generator' ]
    })
}

require('./format.es7')