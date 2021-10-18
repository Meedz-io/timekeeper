const mongoose = require('../../lib/db');
const { Schema } = mongoose;

const ProfileWorkerSchema = new Schema({
    name: {
        type: String, 
        required: true
    },
    profile_url : {
        type: String,
        unique: true
    },
    searchCriteria: {
        type: Object
    },
    created: { type: Date, default: Date.now },
    closedAccount: Boolean
});

module.exports = mongoose.model('Profile_Worker', ProfileWorkerSchema);