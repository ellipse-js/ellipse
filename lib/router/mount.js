'use strict'

module.exports = Mount

function Mount(index) {
    this.index = index
}

Mount.prototype.handle = function (ctx, req, res, next) {
    req.url = req.url.substring(this.index)
    return next()
}
