const mongoose = require('mongoose');

const academicSchema = new mongoose.Schema({
    academic_sem_type: {
        type: String,
        enum: ['Odd', 'Even'],
        required: true,
    },
    academic_sem_label: {
        type: String,
        required: true,
    },
    academic_year: {
        type: String,
        required: true,
    },
    active_sem: {
        type: Boolean,
        default: false,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('academic', academicSchema);