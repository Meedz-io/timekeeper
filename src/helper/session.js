const cacheStorage = require('../lib/cache-storage');

const getRandomSession = () => cacheStorage.hgetall('user_session')
    .then(result => result.filter(session => !session.expired))
    .then(sessions => sessions[Math.floor(Math.random() * sessions.length)])

module.exports = { getRandomSession }