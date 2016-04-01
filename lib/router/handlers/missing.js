/**
 * Created by schwarzkopfb on 15/11/20.
 */

'use strict'

// expose

module.exports = handleMissing

// missing

function handleMissing(ctx) {
    ctx.status = 404
    ctx.body   = 'Cannot ' + ctx.method + ' ' + ctx.originalUrl
    ctx.send()
}
