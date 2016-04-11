/**
 * Created by schwarzkopfb on 16/3/22.
 */

'use strict'

// expose

module.exports = MountPoint

// constructor

function MountPoint(index) {
    this.index = index
}

// instance members

MountPoint.prototype.handle = function (ctx, req, res, next) {
    req.url = req.url.substring(this.index)
    next()
}
