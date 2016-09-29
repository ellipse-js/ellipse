'use strict'

const Ellipse = require('..'),
      app     = new Ellipse

app.get('/', (req, res) => {
    res.body = [
        'try:',
        '/next',
        '/throw',
        '/generator'
    ].join('\n')

    res.type('text/plain').send()
})

app.get('/throw', () => {
    throw new Error('fake')
})

app.get('/next', (req, res, next) => {
    next(new Error('fake'))
})

app.get('/generator', function *() {
    this.throw(403, 'Why So Curious?')
})

/*
    catch errors

    try:
    /next
    /throw
    /generator
*/
app.on('error', (err, ctx) => {
    if (ctx.status === 200)
        ctx.status = 500

    ctx.type = 'text/plain'
    ctx.send('Ouch!\n\n' + err.stack)
})

app.listen(3333)
