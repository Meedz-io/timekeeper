const mongoose = require('../lib/db');
const { Schema } = mongoose;

const UserSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    disabled: Boolean,
    created: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);