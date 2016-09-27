'use strict'

// remind user to enable generator support
try {
    eval('function *gen(){}')
    module.exports = require('./lib/ellipse')
}
catch(ex) {
    throw new Error('`--harmony` flag is required in old node versions')
}
