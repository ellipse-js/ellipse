/**
 * Created by schwarzkopfb on 15/11/20.
 */

'use strict'

// expose

module.exports = handleMissing

// missing

function handleMissing(req, res) {
    res.status(404).send('Cannot ' + req.method + ' ' + req.originalUrl)
}
