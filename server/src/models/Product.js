const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    compareAtPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    attributes: {
      type: Map,
      of: String,
      default: {},
    },

    image: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
  },
);

const productSchema = new mongoose.Schema(
  {
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },

    brand: {
      type: String,
      trim: true,
      maxlength: 100,
      index: true,
    },

    images: [
      {
        type: String,
      },
    ],

    variants: [variantSchema],

    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "ACTIVE", "REJECTED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    reviewCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
});

productSchema.index({
  store: 1,
  status: 1,
});

productSchema.index({
  category: 1,
  status: 1,
});

productSchema.index({
  "variants.price": 1,
});

module.exports = mongoose.model("Product", productSchema);
