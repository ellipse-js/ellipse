'use strict'

const ellipse = require('..'),
      app     = ellipse()

// `app.mount(...)` returns a `Router` instance and
// passes it to `app.use(...)` with the given path prefix
const account = app.mount('/account')

/*
    try:
    /account
 */
account.get('/', (req, res) =>
    res.send('Hello there! It\'s your account!'))

/*
    try:
    /account/profile
 */
account.get('/profile', (req, res) =>
    res.send('It\'s your profile page!'))

// create another sub-router under '/account'
const bills = account.mount('/bills')

/*
    try:
    /account/bills
*/
bills.get('/', (req, res) =>
    res.send('Here are your bills!'))

/*
    try:
    /account/bills/latest
*/
bills.get('/latest', (req, res) =>
    res.send('Here is your latest bill!'))

// Express style sub-router usage is also supported
const pages = new ellipse.Router
app.use('/pages', pages)

/*
    try:
    /pages
*/
pages.get('/', (req, res) =>
    res.send('What a beautiful homepage, isn\'t it?'))

/*
    try:
    /pages/contact
*/
pages.get('/contact', (req, res) =>
    res.send('Drop us an email!'))

// base route handler
app.get('/', function () {
    this.type = 'text/plain'
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
