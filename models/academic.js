const mongoose = require('mongoose');

const academicSchema = new mongoose.Schema({
    academic_sem: {
        type: String,
        required: true,
    },
    academic_year: {
        type: String,
        required: true,
    },
    curr_year: {
        type: String,
        required: true,
    },
    active_sem: {
        type: Number,
        required: true,
    }
}, {
    timestamps: false,
    collection: 'academic'
});

module.exports = mongoose.model('Academic', academicSchema);