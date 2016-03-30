/**
 * Created by schwarzkopfb on 16/3/30.
 */

'use strict'

// expose

module.exports =
    process.version.substring(0, 5) === 'v0.12' ?
    require('events').EventEmitter.listenerCount :
    getListenerCount

// method

function getListenerCount(emitter, event) {
    return emitter.listenerCount(event)
}
