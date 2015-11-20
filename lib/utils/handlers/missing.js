/**
 * Created by schwarzkopfb on 15/11/20.
 */

'use strict';

function handleMissing(req, res) {
    res.status(404).send('Cannot ' + req.method + ' ' + req.originalUrl)
}

module.exports = handleMissing
