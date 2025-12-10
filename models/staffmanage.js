const mongoose= require('mongoose')

const staffSchema = new mongoose.Schema({
    staff_id:{type:String,required:false},
    staff_name:{type:String,required:true},
    department:{type:String,required:true},
    designation:{type:String,required:false},
    category:{type:String,required:false},
    phone_no:{type:Number,required:true,unique:true},
    email:{type:String,required:true},
    college:{type:String,required:true},
    bank_acc_no:{type:String,required:true,unique:true},
    ifsc_code:{type:String,required:true},
    employment_type:{type:String,required:true},
    bank_name:{type:String,required:false},
})

const Staff = mongoose.model('staff_manage',staffSchema)

module.exports = Staff

