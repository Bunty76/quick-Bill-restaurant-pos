const mongoose = require('mongoose');

const MenuItemVariantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Variant name is required'],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, 'Variant price is required'],
    }
}, { _id: false });


const MenuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
    },
    variants: {
        type: [MenuItemVariantSchema],
        required: true,
        validate: [v => Array.isArray(v) && v.length > 0, 'At least one price variant is required']
    },
    imageUrl: {
        type: String,
        required: [true, 'Please add an image URL'],
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

module.exports = mongoose.model('MenuItem', MenuItemSchema);