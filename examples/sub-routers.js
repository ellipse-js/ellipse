/**
 * Created by schwarzkopfb on 15/9/13.
 */

var ellipse = require('../lib/ellipse'),
    app     = ellipse()

// `app.mount(...)` returns a `Router` instance and
// passes it to `app.use(...)` with the given path prefix
var account = app.mount('/account')

/*
    try:
    /account
 */
account.get('/', function (req, res) {
    res.send('Hello there! It\'s your account!')
})

/*
    try:
    /account/profile
 */
account.get('/profile', function (req, res) {
    res.send('It\'s your profile page!')
})

// create another sub-router under '/account'
var bills = account.mount('/bills')

/*
    try:
    /account/bills
*/
bills.get('/', function (req, res) {
    res.send('Here are your bills!')
})

/*
    try:
    /account/bills/latest
*/
bills.get('/latest', function (req, res) {
    res.send('Here is your latest bill!')
})

// Express style sub-router usage is also supported
var pages = new ellipse.Router
app.use('/pages', pages)

/*
    try:
    /pages
*/
pages.get('/', function (req, res) {
    res.send('What a beautiful homepage, isn\'t it?')
})

/*
    try:
    /pages/contact
*/
pages.get('/contact', function (req, res) {
    res.send('Drop us an email!')
})

// base route handler
app.get('/', function () {
    this.body = [
        'try:',
        '/account',
        '/account/profile',
        '/account/bills',
        '/account/bills/latest',
        '/pages',
        '/pages/contact'
    ].join('\n')

    this.send()
})

// start server
app.listen(3333)
