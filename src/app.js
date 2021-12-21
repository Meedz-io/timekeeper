const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const winston = require('winston');
const expressWinston = require('express-winston');

require('../env/config');

const { importAccounts } = require('./actions/linkedin/login');

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
    )
}));

app.use('/search', require('./routes/search'));
app.use('/profile', require('./routes/profile'));

const PORT = process.env.APP_PORT;
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}.`);
    launchApp();
});

const launchApp = async () => {
    await importAccounts();
}

module.exports = app;