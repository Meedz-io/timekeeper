const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

require('../env/config');

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/search', require('./routes/search'));

const PORT = process.env.APP_PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

module.exports = app;