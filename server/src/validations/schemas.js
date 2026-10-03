const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid ID");
const nonEmpty = (max) => z.string().trim().min(1).max(max);
const email = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
const pageNumber = z
  .string()
  .max(7)
  .regex(/^[1-9]\d*$/)
  .refine((value) => Number(value) <= 1_000_000, "Page is too large")
  .optional();
const decimalQuery = z
  .string()
  .max(12)
  .regex(/^\d+(\.\d{1,2})?$/)
  .refine((value) => Number(value) <= 1_000_000_000, "Price is too large")
  .optional();
const nonEmptyPatch = (schema) =>
  schema
    .partial()
    .refine(
      (value) => Object.keys(value).length > 0,
      "At least one field is required",
    );
const params = (name) => z.object({ [name]: objectId });

const address = z.object({
  recipientName: nonEmpty(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\s.-]{8,30}$/),
  addressLine: nonEmpty(250),
  ward: nonEmpty(100),
  district: nonEmpty(100),
  city: nonEmpty(100),
  country: z.string().trim().min(1).max(100).optional().default("Vietnam"),
});

const addressBody = address.extend({ isDefault: z.boolean().optional() });
const addressPatch = nonEmptyPatch(addressBody);

const image = z.object({
  url: z.string().url().max(2048),
  key: nonEmpty(512),
  alt: z.string().max(200).optional().default(""),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

const variant = z
  .object({
    _id: objectId.optional(),
    sku: nonEmpty(64),
    name: z.string().trim().max(100).optional(),
    price: z.number().finite().min(0).max(1_000_000_000),
    compareAtPrice: z
      .number()
      .finite()
      .min(0)
      .max(1_000_000_000)
      .nullable()
      .optional(),
    stock: z.number().int().min(0).max(1_000_000),
    attributes: z.record(z.string(), z.string().max(100)).optional(),
    images: z.array(image).max(10).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.compareAtPrice == null || value.compareAtPrice >= value.price,
    {
      path: ["compareAtPrice"],
      message: "Compare-at price must be greater than or equal to price",
    },
  );

const productBody = z.object({
  name: nonEmpty(200),
  description: nonEmpty(5000),
  brand: z.string().trim().max(100).optional(),
  category: objectId,
  images: z.array(image).max(10).optional(),
  variants: z.array(variant).min(1).max(50),
});

const categoryBody = z.object({
  name: nonEmpty(100),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(1000).optional(),
  image: z.string().url().max(2048).nullable().optional(),
  parent: objectId.nullable().optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional(),
  isActive: z.boolean().optional(),
});

const storeBody = z.object({
  name: nonEmpty(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(2000).optional(),
  logo: z.string().url().max(2048).nullable().optional(),
  banner: z.string().url().max(2048).nullable().optional(),
});

module.exports = {
  idParams: params,
  authRegister: z.object({
    name: nonEmpty(100).min(2),
    email,
    password: z
      .string()
      .min(8)
      .max(72)
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password must be at most 72 bytes",
      ),
  }),
  authVerifyRegistrationOtp: z.object({
    email,
    code: z.string().regex(/^\d{6}$/),
  }),
  authLogin: z.object({
    email,
    password: z
      .string()
      .min(1)
      .max(72)
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password must be at most 72 bytes",
      ),
  }),
  refreshToken: z.object({ refreshToken: z.string().min(20).max(4096) }),
  updateProfile: nonEmptyPatch(
    z.object({
      name: nonEmpty(100).min(2),
      avatar: z.string().url().max(2048).nullable(),
    }),
  ),
  changePassword: z
    .object({
      currentPassword: z.string().min(1).max(72),
      newPassword: z
        .string()
        .min(8)
        .max(72)
        .refine(
          (value) => Buffer.byteLength(value, "utf8") <= 72,
          "Password must be at most 72 bytes",
        ),
    })
    .refine((value) => value.currentPassword !== value.newPassword, {
      path: ["newPassword"],
      message: "New password must differ from current password",
    }),
  sellerApplication: z.object({
    businessName: nonEmpty(150).min(2),
    description: z.string().trim().max(2000).optional().default(""),
    reason: nonEmpty(1000).min(5),
  }),
  addressBody,
  addressPatch,
  categoryBody,
  categoryPatch: nonEmptyPatch(categoryBody),
  productBody,
  productPatch: nonEmptyPatch(productBody),
  productQuery: z
    .object({
      search: z.string().trim().max(100).optional(),
      category: objectId.optional(),
      brand: z.string().trim().max(100).optional(),
      minPrice: decimalQuery,
      maxPrice: decimalQuery,
      sort: z.enum(["newest", "price_asc", "price_desc", "rating"]).optional(),
      page: pageNumber,
      limit: pageNumber,
    })
    .refine(
      (value) =>
        value.minPrice === undefined ||
        value.maxPrice === undefined ||
        Number(value.minPrice) <= Number(value.maxPrice),
      {
        path: ["maxPrice"],
        message: "Maximum price must be greater than or equal to minimum price",
      },
    ),
  cartAdd: z.object({
    productId: objectId,
    variantId: objectId.optional(),
    quantity: z.number().int().min(1).max(99).optional(),
  }),
  cartUpdate: z.object({
    productId: objectId,
    variantId: objectId,
    quantity: z.number().int().min(1).max(99),
  }),
  cartRemove: z.object({ productId: objectId, variantId: objectId.optional() }),
  orderCreate: z.object({ shippingAddress: address }),
  orderQuery: z.object({ page: pageNumber, limit: pageNumber }),
  reviewCreate: z.object({
    productId: objectId,
    orderId: objectId,
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(2000).optional().default(""),
  }),
  reviewQuery: z.object({ page: pageNumber, limit: pageNumber }),
  sellerApplicationRejection: z.object({
    rejectionReason: nonEmpty(1000).min(3),
  }),
  storeCreate: storeBody,
  storePatch: nonEmptyPatch(storeBody.omit({ slug: true })),
  uploadCreate: z.object({
    productId: objectId,
    fileName: nonEmpty(255),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    fileSize: z
      .number()
      .int()
      .positive()
      .max(5 * 1024 * 1024),
  }),
  uploadDelete: z.object({ key: nonEmpty(1024) }),
  chatConversationCreate: z.object({
    type: z.enum(["STORE", "ADMIN"]),
    storeId: objectId.optional(),
  }).refine((value) => value.type !== "STORE" || Boolean(value.storeId), {
    path: ["storeId"],
    message: "A store is required to contact a seller",
  }),
  chatMessage: z.object({ content: nonEmpty(2000) }),
};
