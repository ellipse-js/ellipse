/**
 * Created by schwarzkopfb1 on 11/05/16.
 *
 * NOTE: this file should be removed when the maintenance period of node.js@0.12.x ends
 */

'use strict'

// EventEmitter.prototype.listenerCount(type)

var EE = require('events').EventEmitter,
    lc = EE.listenerCount

if (EE.prototype.listenerCount === undefined)
    EE.prototype.listenerCount = function listenerCount(type) {
        lc.call(this, type)
    }

// Object.setPrototypeOf(target, proto)

if (Object.setPrototypeOf === undefined)
    Object.setPrototypeOf = function setPrototypeOf(target, proto) {
        target.__proto__ = proto
        return target
    }

// Promise (fake)

if (typeof Promise === 'undefined')
    global.Promise = function Promise() {
    }
