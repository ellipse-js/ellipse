/**
 * Created by schwarzkopfb on 16/3/22.
 */

'use strict'

function MountPoint(index) {
    this.index = index
}

MountPoint.prototype.handle = function (ctx, req, res, next) {
    ctx.mounted = true
    req.url     = req.url.substring(this.index)

    // clear cached req.path
    delete req._path
    delete req._pathLength

    next()
}

module.exports = MountPoint
