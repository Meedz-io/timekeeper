const mongoose = require('mongoose');
const username = encodeURIComponent(process.env.MONGO_AUTH_ID);
const password = encodeURIComponent(process.env.MONGO_AUTH_PASS);
const clusterUrl = process.env.MONGO_CLUSTER_URL;

mongoose.connect(`mongodb://${username}:${password}@${clusterUrl}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

mongoose.connection.on('error', console.error.bind(console, '[MONGODB] Connection error:'));

module.exports = mongoose;