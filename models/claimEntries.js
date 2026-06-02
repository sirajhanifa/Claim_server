const mongoose = require('mongoose');

const claimEntrySchema = new mongoose.Schema({

    academic_sem_label: {
        type: String,
        required: true,
        trim: true
    },

    // Staff Information
    staff_id: {
        type: String,
        trim: true
    },

    staff_name: {
        type: String,
        required: true,
        trim: true
    },

    designation: {
        type: String,
        required: true,
        trim: true
    },

    department: {
        type: String,
        required: true,
        trim: true
    },

    internal_external: {
        type: String,
        required: true,
        trim: true
    },

    category: {
        type: String,
        required: false,
        trim: true
    },

    college: {
        type: String,
        required: false,
        trim: true
    },

    // Claim Information
    claim_type_name: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        default: 'Unsubmitted',
        enum: ['Unsubmitted', 'Processed', 'Submitted', 'Credited'],
        trim: true
    },

    payment_report_id: {
        type: String,
        default: null,
        trim: true
    },

    // Contact Information
    phone_number: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true
    },

    // Banking Information
    account_no: {
        type: String,
        required: true,
        trim: true
    },

    ifsc_code: {
        type: String,
        required: true,
        trim: true
    },

    bank_city_name: {
        type: String,
        trim: true,
        default: null
    },

    // Financial Information
    tds_amount: {
        type: Number,
        required: true,                
        default: -1
    },

    amount: {
        type: Number,
        required: true
    },

    course_code:{
        type: String,
        default: null,
        trim: true
    },

    // Date Information
    entry_date: {
        type: Date,
        required: true
    },

    processed_date: {
        type: Date,
        default: null
    },

    submitted_date: {
        type: Date,
        default: null
    },

    credited_date: {
        type: Date,
        default: null
    },

    email_status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    }

}, { timestamps: true });

module.exports = mongoose.model('claim_entries', claimEntrySchema);