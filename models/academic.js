const mongoose = require('mongoose');

const academicSchema = new mongoose.Schema({
    academic_sem_type: {
        type: String,
        enum: ['Odd', 'Even'],
        required: true,
        trim: true
    },
    academic_sem_label: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(v);
            },
            message: props => `${props.value} is not a valid semester label! Use format 'Mon-YY' (e.g., Jun-26)`
        }
    },
    academic_year: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                const regex = /^\d{4}-\d{4}$/;
                if (!regex.test(v)) return false;
                const [start, end] = v.split('-').map(Number);
                return end === start + 1;
            },
            message: props => `${props.value} is not a valid academic year! Use 'YYYY-YYYY' where second year = first year + 1`
        }
    },
    active_sem: {
        type: Boolean,
        default: false,
        required: true
    },
    total_claim_amount: { type: Number, default: 0 },
    total_claim_count: { type: Number, default: 0 },
    claim_counters: {
        TOTAL: { type: Number, default: 0 },
        PRAC: { type: Number, default: 0 },
        CV: { type: Number, default: 0 },
        COE: { type: Number, default: 0 },
        SKILLED: { type: Number, default: 0 },
        AEC: { type: Number, default: 0 },
        QPS: { type: Number, default: 0 },
        OTHER: { type: Number, default: 0 },
        ALL: { type: Number, default: 0 },
        SCRU: { type: Number, default: 0 },
        CIA: { type: Number, default: 0 },
        CAMP: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('academic', academicSchema);