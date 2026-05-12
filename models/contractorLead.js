import mongoose from 'mongoose';

const contractorLeadSchema = new mongoose.Schema(
    {
        contractorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contractor',
            required: true
        },
        requesterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usertable'
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"]
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        requirement: {
            type: String,
            required: true
        },
        location: {
            type: String,
            required: true
        },
        budget: String,
        projectSize: String,
        preferredStartDate: Date,
        attachments: [mongoose.Schema.Types.Mixed],
        sourcePage: String,
        
        status: {
            type: String,
            enum: ['new', 'reviewed', 'contacted', 'quoted', 'closed', 'spam'],
            default: 'new'
        },
        adminNotes: String,
        providerNotes: String
    },
    { timestamps: true }
);

contractorLeadSchema.index({ contractorId: 1, status: 1 });
contractorLeadSchema.index({ requesterId: 1 });

const ContractorLead = mongoose.model('ContractorLead', contractorLeadSchema);
export default ContractorLead;
