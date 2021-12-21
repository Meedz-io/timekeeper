const Redis = require("ioredis");

const redisPool = require('redis-connection-pool')('cache-storage', {
    host: 'localhost',
    port: process.env.REDIS_PORT,
    max_clients: 30,
    database: 0
});

Redis.Command.setReplyTransformer("hgetall", (result) => {
    const arr = [];
    for (let i = 0; i < result.length; i += 2) {
      arr.push({id: result[i], info: JSON.parse(result[i + 1])});
    }
    return arr;
});

module.exports = new Redis({
    port: process.env.REDIS_PORT,
    host: "127.0.0.1",
    family: 4,
    db: 0,
});