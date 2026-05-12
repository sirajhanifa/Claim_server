const mongoose = require('mongoose');

const claimEntrySchema = new mongoose.Schema({

    academic_sem_label: { type: String, required: true },

    // Staff Information
    staff_id: { type: String, required: true },
    staff_name: { type: String, required: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    internal_external: { type: String, required: true },
    category: { type: String, required: false },
    college: { type: String, required: false },

     // Claim Information
    claim_type_name: { type: String, required: true },
    status: {
        type: String,
        default: 'Unsubmitted',
        enum: ['Unsubmitted', 'Processed', 'Submitted', 'Credited']
    },
    payment_report_id: {
        type: String,
        default: ''
    },

    // Contact Information
    phone_number: { type: String, required: true },
    email: { type: String, required: true },

    // Banking Information
    account_no: { type: String, required: true },
    ifsc_code: { type: String, required: true },

    // Financial Information
    tds_amount: { type: Number, required: true, default: -1 },
    amount: { type: Number, required: true },

    // Date Information
    entry_date: { type: Date, required: true },
    processed_date: { type: Date, default: null },
    submitted_date: { type: Date, default: null },
    credited_date: { type: Date, default: null }

}, { timestamps: true });

module.exports = mongoose.model('claim_entries', claimEntrySchema); q