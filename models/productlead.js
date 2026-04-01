import mongoose from 'mongoose';

const productLeadSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usertable'
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    profession: {
        type: String,
        required: true
    },
    company: String,
    city: {
        type: String,
        required: true
    },
    address: String,
    no: String,
    postcode: String,
    tel: String,
    message: String,
    
    // Request options
    catalogue: { type: Boolean, default: false },
    priceList: { type: Boolean, default: false },
    bimCad: { type: Boolean, default: false },
    retailersList: { type: Boolean, default: false },
    contactRepresentative: { type: Boolean, default: false },
    
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Contacted'],
        default: 'Pending'
    }
}, { timestamps: true });

const ProductLead = mongoose.model('ProductLead', productLeadSchema);

export default ProductLead;
