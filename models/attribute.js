import mongoose from 'mongoose';

// Declare the Schema of the Mongo model
const attributeSchema = new mongoose.Schema({
    attributeName: {
        type: String,
        required: [true, "attribute Name is required"],
        unique: [true, "attribute Name must be unique"],
        // index:true,
    },
    attributeValues: {
        type: Array,
        default: []
    },
    status: {
        type: Number,
        default: 1,
    },
}, { timestamps: true });

//Export the model
export default mongoose.model('Attribute', attributeSchema);