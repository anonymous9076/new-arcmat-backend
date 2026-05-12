import mongoose from 'mongoose'

const contactschema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Please provide a valid 10-digit mobile number"]
    },
    email: {
        type: String,
        required: true
    },
    Message: {
        type: String,
        required: true
    }
})

const contactus = mongoose.model('contactus', contactschema)

export default contactus