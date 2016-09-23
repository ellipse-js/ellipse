'use strict'

// expose

module.exports = Mount

// constructor

function Mount(index) {
    this.index = index
}

// instance members

Mount.prototype.handle = function (ctx, req, res, next) {
    req.url = req.url.substring(this.index)
    next()
}
