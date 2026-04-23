const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
    restaurantName: {
        type: String,
        required: true,
        default: 'QuickBill Restaurant'
    },
    address: {
        type: String,
        required: true,
        default: '123 Foodie Lane, Gourmet City'
    },
    phone: {
        type: String,
        required: true,
        default: 'N/A'
    },
    logoUrl: {
        type: String,
        default: ''
    },
    taxRate: {
        type: Number,
        default: 0.18,
        min: 0,
        max: 1
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    },
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

module.exports = mongoose.model('Profile', ProfileSchema);