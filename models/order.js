const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    customer: {
        name: { type: String },
        mobile: { type: String },
    },
    items: [{
        item: {
            id: { type: String, required: true },
            name: { type: String, required: true },
            imageUrl: { type: String, required: true },
        },
        quantity: { type: Number, required: true },
        selectedVariant: {
            name: { type: String, required: true },
            price: { type: Number, required: true }
        },
    }],
    subtotal: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        required: true,
    },
    total: {
        type: Number,
        required: true,
    },
    currency: {
        code: { type: String, required: true },
        symbol: { type: String, required: true },
        rate: { type: Number, required: true },
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cash', 'upi', 'card'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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

module.exports = mongoose.model('Order', OrderSchema);