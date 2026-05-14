const mongoose = require('mongoose');

const academicSchema = new mongoose.Schema({

    // Semester Details
    academic_sem_type: {
        type: String,
        enum: ['Odd', 'Even'],
        required: true,
        trim: true
    },

    academic_sem_label: {
        type: String,
        required: true,
        trim: true
    },

    academic_year: {
        type: String,
        required: true,
        trim: true
    },

    active_sem: {
        type: Boolean,
        default: false,
        required: true
    },

    // Overall Statistics
    total_claim_amount: {
        type: Number,
        default: 0
    },

    total_claim_count: {
        type: Number,
        default: 0
    },

    // Claim Submission Counters
    claim_counters: {
        TOTAL: {
            type: Number,
            default: 0
        },

        PRAC: {
            type: Number,
            default: 0
        },

        CV: {
            type: Number,
            default: 0
        },

        COE: {
            type: Number,
            default: 0
        },

        SKILLED: {
            type: Number,
            default: 0
        },

        AEC: {
            type: Number,
            default: 0
        },

        QPS: {
            type: Number,
            default: 0
        },

        OTHER: {
            type: Number,
            default: 0
        },

        ALL: {
            type: Number,
            default: 0
        },

        SCRU: {
            type: Number,
            default: 0
        },

        CIA: {
            type: Number,
            default: 0
        },

        CAMP: {
            type: Number,
            default: 0
        }
    }

}, { timestamps: true });

module.exports = mongoose.model('academic', academicSchema);