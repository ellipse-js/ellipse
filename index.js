'use strict'

// remind user to enable generator support
try {
    eval('function *gen(){}')
}
catch(ex) {
    /* istanbul ignore next */
    throw new Error('`--harmony` flag is required in early node versions')
}

module.exports = require('./lib/ellipse')
