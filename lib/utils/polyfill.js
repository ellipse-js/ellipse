/**
 * NOTE: this file should be removed when the maintenance period of node.js@0.12.x ends
 */

'use strict'

// EventEmitter.prototype.listenerCount(type)

var Emitter = require('events')

if (Emitter.prototype.listenerCount === undefined)
    Emitter.prototype.listenerCount = function listenerCount(type) {
        return this.listeners(type).length
    }
