const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
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
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
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

    images: [
      {
        type: String,
      },
    ],

    variants: [variantSchema],

    stock: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    reviewCount: {
      type: Number,
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
});

productSchema.index({
  store: 1,
  status: 1,
});

productSchema.index({
  category: 1,
  status: 1,
});

module.exports = mongoose.model("Product", productSchema);
