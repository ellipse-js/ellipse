/**
 * Created by schwarzkopfb on 15/11/21.
 */

var merge = require('merge-descriptors')

function isExtended(proto) {
    return Object.keys(proto).length
}

function extendPrototypes(app, ctx, req, res) {
    // merge is expensive, so only do if necessary
    if(app._extended === undefined) {
        if (app._ctxExtended === undefined)
            app._ctxExtended = isExtended(app.context)

        if (app._reqExtended === undefined)
            app._reqExtended = isExtended(app.request)

        if (app._resExtended === undefined)
            app._resExtended = isExtended(app.response)

        app._extended = (
            app._ctxExtended ||
            app._reqExtended ||
            app._resExtended
        )
    }

    if(app._reqExtended)
        merge(req, app.request)

    if(app._resExtended)
        merge(res, app.response)

    if(app._ctxExtended)
        merge(ctx, app.context)
}

module.exports = extendPrototypes
