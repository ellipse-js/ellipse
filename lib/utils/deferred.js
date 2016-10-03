'use strict'

module.exports = Deferred

function Deferred() {
    this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject  = reject
    })

    // prevent pointless `UnhandledPromiseRejectionWarning`s
    this.promise.catch(noop)
}

Deferred.createIf = function (condition) {
    if (condition)
        return new Deferred
}

function noop() {}
