const mongoose = require('../lib/db');
const { Schema } = mongoose;

const ProfileSchema = new Schema({
    name: String,
    account_id : {
        type: String,
        unique: true
    },
    profile_title: String,
    location: String,
    contact_details: {
        phone_number: String,
        email: String,
        birthday: String
    },
    profile_picture: String,
    profile_info: String,
    experiences: Array,
    education: Array,
    languages: Array,
    skills: Object,
    error: Object,
    created: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Profile', ProfileSchema);