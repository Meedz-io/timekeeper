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
    account_id : {
        type: String,
        unique: true
    },
    searchCriteria: {
        type: Object
    },
    searchId: {
        type: String
    },
    created: { type: Date, default: Date.now },
    done: Boolean
});

module.exports = mongoose.model('Profile_Worker', ProfileWorkerSchema);