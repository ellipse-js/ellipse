/**
 * Created by schwarzkopfb on 15/9/12.
 */

var production  = process.env.NODE_ENV === 'production',
    http        = require('http'),
    proto       = http.ServerResponse.prototype,
    statusCodes = http.STATUS_CODES,
    escapeHtml  = require('escape-html')

proto.send = function (body) {
    var status  = this.statusCode || 200,
        message = this.statusMessage || statusCodes[status ],
        headers = this.headers = {}

    if(!body)
        body = ''

    headers['content-length'] = Buffer.byteLength(body)

    if(!('content-type' in headers))
        headers['content-type'] = 'text/plain; charset=utf8'
    else if(!~headers['content-type'].indexOf('charset'))
        headers['content-type'] += '; charset=utf8'

    this.writeHead(status, message, headers)
    this.write(body)
    this.end()

    return this
}

proto.status = function (code, message) {
    this.statusCode    = code
    this.statusMessage = message || statusCodes[code]

    return this
}

proto.set = function (field, value) {
    if(!this.headers)
        this.headers = {}

    this.headers[ field.toLowerCase() ] = value

    return this
}

proto.get = function (field) {
    if(!this.headers)
        this.headers = {}

    return this.headers[ field.toLowerCase() ]
}

proto.json = function (value) {
    if(production)
        var body = JSON.stringify(value)
    else
        body = JSON.stringify(value, null, 4)

    return this.set('content-type', 'application/json').send(body)
}

proto.redirect = function (url) {
    var req     = this.req,
        message = statusCodes[ 302 ],
        body

    switch (req.headers[ 'accept' ]) {
        case 'text/plain':
        case 'text/*':
            this.set('content-type', 'text/plain')

            body = message + '. Redirecting to ' + encodeURI(url)
            break

        case 'text/html':
        case '*/*':
            this.set('content-type', 'text/html')

            var u = escapeHtml(url)
            body  = '<p>' + message + '. Redirecting to <a href="' + u + '">' + u + '</a></p>'
            break

        default:
            body = ''
            break
    }

    this.status(302).set('location', url)

    // Respond
    if (req.method === 'HEAD')
        this.send()
    else
        this.send(body)
}

module.exports = proto
