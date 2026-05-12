const mongoose = require('mongoose')

const staffSchema = new mongoose.Schema({

    // Staff Basic Details
    staff_id: { type: String, required: true },
    staff_name: { type: String, required: true },

    // Organization Details
    college: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: false },
    category: { type: String, required: false },
    employment_type: { type: String, required: true },

    // Contact Details
    phone_no: { type: String, required: true, unique: true },
    email: { type: String, required: true },

    // Bank Details
    bank_acc_no: { type: String, required: true, unique: true },
    ifsc_code: { type: String, required: true },

}, { timestamps: true })

module.exports = mongoose.model('staff', staffSchema)