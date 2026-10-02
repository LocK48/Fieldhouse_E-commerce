const mongoose = require("mongoose");

const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    key: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      default: "",
      maxlength: 200,
      trim: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

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

    images: {
      type: [productImageSchema],
      default: [],
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

    images: {
      type: [productImageSchema],
      default: [],
    },

    variants: {
      type: [variantSchema],
      default: [],
    },

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

productSchema.index(
  {
    store: 1,
    slug: 1,
  },
  {
    unique: true,
  },
);

productSchema.index({
  "variants.price": 1,
});

productSchema.virtual("priceRange").get(function () {
  if (!this.variants.length) {
    return null;
  }

  const prices = this.variants.map((variant) => variant.price);

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
});

productSchema.virtual("totalStock").get(function () {
  return this.variants.reduce((total, variant) => total + variant.stock, 0);
});

productSchema.set("toJSON", {
  virtuals: true,
});

productSchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model("Product", productSchema);
