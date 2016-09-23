'use strict'

// expose

module.exports = handleMissing

// missing

function handleMissing(ctx) {
    ctx.status = 404
    ctx.body   = 'Cannot ' + ctx.method + ' ' + ctx.originalUrl
    ctx.send()
}
