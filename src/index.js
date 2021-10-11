require('../env/config.js');
//const logger = require('./models/logger');
const { navigateTo } = require('./actions/navigate');

// Exemple of usage
navigateTo('https://www.linkedin.com')
    .then(data => console.log(data.body.innerHTML))
    .catch(err => console.warn(err));