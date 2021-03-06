'use strict'

const Ellipse    = require('..'),
      app        = new Ellipse,
      bodyParser = require('body-parser') // Express' official body parser

app.get('/', function () {
    this.body = [
        'try:',
        'POST /api/user { "id": 1, "name": "jdoe" }',
        'GET  /api/user/latest',
        'POST /api/comment { "id": 1, "text": "lorem ipsum" }',
        'GET  /api/comment/latest'
    ].join('\n')

    this.type = 'text/plain'
    this.send()
})

var user    = null,
    comment = null

// include body parser middleware
app.use(bodyParser.json())

/*
    try:
    /api/user/latest
 */
app.get('/api/user/latest', (req, res) =>
    res.json(user))

/*
    try:
    POST /api/user { "id": 1, "name": "jdoe" }
 */
app.post('/api/user', function (req, res) {
    this.json = user = req.body
    this.send()
})

/*
    try:
    /api/comment/latest
 */
app.get('/api/comment/latest', function () {
    this.json = comment
    this.send()
})

/*
    try:
    POST /api/comment { "id": 1, "text": "lorem ipsum" }
 */
app.post('/api/comment', (req, res) =>
    res.json(comment = req.body))

// start listening
app.listen(3333)
