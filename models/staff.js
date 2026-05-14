const mongoose = require('mongoose')

const staffSchema = new mongoose.Schema({

    // Staff Basic Details
    staff_id: {
        type: String,
        required: true,
        trim: true
    },

    staff_name: {
        type: String,
        required: true,
        trim: true
    },

    // Organization Details
    college: {
        type: String,
        required: true,
        trim: true
    },

    department: {
        type: String,
        required: true,
        trim: true
    },

    designation: {
        type: String,
        required: false,
        trim: true
    },

    category: {
        type: String,
        required: false,
        trim: true
    },

    employment_type: {
        type: String,
        required: true,
        trim: true
    },

    // Contact Details
    phone_no: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },

    // Bank Details
    bank_acc_no: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    ifsc_code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },

}, { timestamps: true })

module.exports = mongoose.model('staff', staffSchema)