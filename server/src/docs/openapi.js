const id = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
};

const json = (schema) => ({
  required: true,
  content: { "application/json": { schema } },
});

const operation = (summary, tag, options = {}) => ({
  summary,
  tags: [tag],
  ...(options.auth ? { security: [{ bearerAuth: [] }] } : {}),
  ...(options.parameters ? { parameters: options.parameters } : {}),
  ...(options.requestBody ? { requestBody: options.requestBody } : {}),
  responses: {
    ...(options.responses || {}),
    ...(options.auth ? { "401": { $ref: "#/components/responses/Unauthorized" } } : {}),
    ...(options.responses?.["400"] ? {} : { "400": { $ref: "#/components/responses/BadRequest" } }),
  },
});

const pagedQuery = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
];

const productQuery = [
  { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
  { name: "category", in: "query", schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } },
  { name: "brand", in: "query", schema: { type: "string", maxLength: 100 } },
  { name: "minPrice", in: "query", schema: { type: "number", minimum: 0 } },
  { name: "maxPrice", in: "query", schema: { type: "number", minimum: 0 } },
  { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "price_asc", "price_desc", "rating"] } },
  ...pagedQuery,
];

module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Fieldhouse API",
    version: "1.0.0",
    description: [
      "REST API for the Fieldhouse sports marketplace.",
      "Protected endpoints use a JWT access token. In Swagger UI, use Authorize and enter the token without the Bearer prefix.",
      "The realtime chat transport uses Socket.IO at the API origin and is not a REST endpoint.",
    ].join("\n\n"),
  },
  servers: [{ url: "/api/v1", description: "Current API origin" }],
  tags: [
    { name: "Health" }, { name: "Authentication" }, { name: "Products" },
    { name: "Categories" }, { name: "Stores" }, { name: "Users" },
    { name: "Addresses" }, { name: "Cart" }, { name: "Orders" },
    { name: "Wishlist" }, { name: "Reviews" }, { name: "Uploads and media" },
    { name: "Chat" }, { name: "Admin" },
  ],
  paths: {
    "/health": {
      get: operation("Check API health", "Health", { responses: { "200": { description: "API is running" } } }),
    },
    "/auth/register/request-otp": {
      post: operation("Request an email verification code", "Authentication", { requestBody: json({ $ref: "#/components/schemas/RegisterRequest" }) }),
    },
    "/auth/register/verify-otp": {
      post: operation("Verify the code and create an account", "Authentication", { requestBody: json({ $ref: "#/components/schemas/VerifyOtpRequest" }) }),
    },
    "/auth/login": {
      post: operation("Sign in", "Authentication", { requestBody: json({ $ref: "#/components/schemas/LoginRequest" }) }),
    },
    "/auth/refresh": {
      post: operation("Refresh access and refresh tokens", "Authentication", { requestBody: json({ $ref: "#/components/schemas/RefreshRequest" }) }),
    },
    "/auth/logout": {
      post: operation("Revoke a refresh token", "Authentication", { requestBody: json({ $ref: "#/components/schemas/RefreshRequest" }) }),
    },
    "/auth/me": {
      get: operation("Get the signed-in account", "Authentication", { auth: true }),
    },
    "/products": {
      get: operation("Search and browse active products", "Products", { parameters: productQuery }),
      post: operation("Create a product (seller)", "Products", { auth: true, requestBody: json({ $ref: "#/components/schemas/ProductInput" }) }),
    },
    "/products/seller/me": {
      get: operation("List the seller's products", "Products", { auth: true }),
    },
    "/products/{id}": {
      get: operation("Get product details", "Products", { parameters: [id] }),
      patch: operation("Update a seller-owned product", "Products", { auth: true, parameters: [id], requestBody: json({ $ref: "#/components/schemas/ProductInput" }) }),
      delete: operation("Archive a seller-owned product", "Products", { auth: true, parameters: [id] }),
    },
    "/categories": {
      get: operation("List categories", "Categories"),
      post: operation("Create a category (admin)", "Categories", { auth: true, requestBody: json({ $ref: "#/components/schemas/CategoryInput" }) }),
    },
    "/categories/{id}": {
      get: operation("Get a category", "Categories", { parameters: [id] }),
      patch: operation("Update a category (admin)", "Categories", { auth: true, parameters: [id], requestBody: json({ $ref: "#/components/schemas/CategoryInput" }) }),
      delete: operation("Delete a category (admin)", "Categories", { auth: true, parameters: [id] }),
    },
    "/stores/slug/{slug}": {
      get: operation("Get a public store and its products", "Stores", { parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }] }),
    },
    "/stores": {
      post: operation("Create a seller store", "Stores", { auth: true, requestBody: json({ $ref: "#/components/schemas/StoreInput" }) }),
    },
    "/stores/me": {
      get: operation("Get the seller's store", "Stores", { auth: true }),
      patch: operation("Update the seller's store", "Stores", { auth: true, requestBody: json({ $ref: "#/components/schemas/StoreUpdate" }) }),
    },
    "/users/me": {
      get: operation("Get the current profile", "Users", { auth: true }),
      patch: operation("Update profile name or avatar", "Users", { auth: true, requestBody: json({ type: "object", properties: { name: { type: "string" }, avatar: { type: "string", nullable: true } } }) }),
    },
    "/users/me/password": {
      patch: operation("Change password", "Users", { auth: true, requestBody: json({ type: "object", required: ["currentPassword", "newPassword"], properties: { currentPassword: { type: "string" }, newPassword: { type: "string", minLength: 8 } } }) }),
    },
    "/users/me/seller-application": {
      post: operation("Apply to become a seller", "Users", { auth: true, requestBody: json({ type: "object", required: ["businessName", "reason"], properties: { businessName: { type: "string" }, description: { type: "string" }, reason: { type: "string" } } }) }),
    },
    "/users/me/addresses": {
      get: operation("List saved addresses", "Addresses", { auth: true }),
      post: operation("Add a saved address", "Addresses", { auth: true, requestBody: json({ $ref: "#/components/schemas/AddressInput" }) }),
    },
    "/users/me/addresses/{addressId}": {
      patch: operation("Update a saved address", "Addresses", { auth: true, parameters: [{ ...id, name: "addressId" }], requestBody: json({ $ref: "#/components/schemas/AddressInput" }) }),
      delete: operation("Delete a saved address", "Addresses", { auth: true, parameters: [{ ...id, name: "addressId" }] }),
    },
    "/cart": {
      get: operation("Get the current cart", "Cart", { auth: true }),
      delete: operation("Clear the cart", "Cart", { auth: true }),
    },
    "/cart/items": {
      post: operation("Add an item to cart", "Cart", { auth: true, requestBody: json({ $ref: "#/components/schemas/CartItemInput" }) }),
      patch: operation("Update cart item quantity", "Cart", { auth: true, requestBody: json({ $ref: "#/components/schemas/CartItemInput" }) }),
      delete: operation("Remove item(s) from cart", "Cart", { auth: true, parameters: [{ name: "productId", in: "query", required: true, schema: { type: "string" } }, { name: "variantId", in: "query", schema: { type: "string" } }] }),
    },
    "/orders": {
      post: operation("Place a COD order from the cart", "Orders", { auth: true, requestBody: json({ type: "object", required: ["shippingAddress"], properties: { shippingAddress: { $ref: "#/components/schemas/AddressInput" } } }) }),
      get: operation("List the current customer's orders", "Orders", { auth: true, parameters: pagedQuery }),
    },
    "/orders/seller": {
      get: operation("List orders containing this seller's items", "Orders", { auth: true }),
    },
    "/orders/seller/{id}/confirm-payment": {
      patch: operation("Confirm receipt of the seller's COD payment after delivery", "Orders", { auth: true, parameters: [id] }),
    },
    "/orders/{id}": {
      get: operation("Get one of the current customer's orders", "Orders", { auth: true, parameters: [id] }),
    },
    "/orders/{id}/cancel": {
      patch: operation("Cancel a pending COD order", "Orders", { auth: true, parameters: [id] }),
    },
    "/wishlist": {
      get: operation("Get saved products", "Wishlist", { auth: true }),
    },
    "/wishlist/{productId}": {
      put: operation("Save a product", "Wishlist", { auth: true, parameters: [{ ...id, name: "productId" }] }),
      delete: operation("Remove a saved product", "Wishlist", { auth: true, parameters: [{ ...id, name: "productId" }] }),
    },
    "/reviews/products/{productId}": {
      get: operation("List reviews for a product", "Reviews", { parameters: [{ ...id, name: "productId" }, ...pagedQuery] }),
    },
    "/reviews": {
      post: operation("Review a product from a delivered order", "Reviews", { auth: true, requestBody: json({ type: "object", required: ["productId", "orderId", "rating"], properties: { productId: { type: "string" }, orderId: { type: "string" }, rating: { type: "integer", minimum: 1, maximum: 5 }, comment: { type: "string" } } }) }),
    },
    "/reviews/{reviewId}": {
      delete: operation("Delete an owned review", "Reviews", { auth: true, parameters: [{ ...id, name: "reviewId" }] }),
    },
    "/uploads/products/presigned-url": {
      post: operation("Create a presigned R2 image upload URL (seller)", "Uploads and media", { auth: true, requestBody: json({ type: "object", required: ["productId", "fileName", "contentType", "fileSize"], properties: { productId: { type: "string" }, fileName: { type: "string" }, contentType: { type: "string", enum: ["image/jpeg", "image/png", "image/webp"] }, fileSize: { type: "integer", maximum: 5242880 } } }) }),
    },
    "/uploads/products/{productId}/image": {
      delete: operation("Delete a product image from R2 (seller)", "Uploads and media", { auth: true, parameters: [{ ...id, name: "productId" }], requestBody: json({ type: "object", required: ["key"], properties: { key: { type: "string" } } }) }),
    },
    "/media": {
      get: operation("Serve an active product image by its R2 key", "Uploads and media", { parameters: [{ name: "key", in: "query", required: true, schema: { type: "string" } }] }),
    },
    "/chat/conversations": {
      get: operation("List conversations visible to the current user", "Chat", { auth: true }),
      post: operation("Start or open a store or support conversation", "Chat", { auth: true, requestBody: json({ type: "object", required: ["type"], properties: { type: { type: "string", enum: ["STORE", "ADMIN"] }, storeId: { type: "string" } } }) }),
    },
    "/chat/conversations/{conversationId}/messages": {
      get: operation("Load a page of conversation messages", "Chat", { auth: true, parameters: [{ ...id, name: "conversationId" }, { name: "before", in: "query", schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } }, { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } }] }),
    },
    "/admin/seller-applications": {
      get: operation("List seller applications (admin)", "Admin", { auth: true }),
    },
    "/admin/seller-applications/{userId}/approve": {
      patch: operation("Approve a seller application (admin)", "Admin", { auth: true, parameters: [{ ...id, name: "userId" }] }),
    },
    "/admin/seller-applications/{userId}/reject": {
      patch: operation("Reject a seller application (admin)", "Admin", { auth: true, parameters: [{ ...id, name: "userId" }], requestBody: json({ type: "object", required: ["rejectionReason"], properties: { rejectionReason: { type: "string" } } }) }),
    },
    "/admin/stores/pending": {
      get: operation("List stores pending review (admin)", "Admin", { auth: true }),
    },
    "/admin/stores/{storeId}/approve": {
      patch: operation("Approve a store (admin)", "Admin", { auth: true, parameters: [{ ...id, name: "storeId" }] }),
    },
    "/admin/stores/{storeId}/suspend": {
      patch: operation("Suspend a store (admin)", "Admin", { auth: true, parameters: [{ ...id, name: "storeId" }] }),
    },
    "/admin/products/pending": {
      get: operation("List products pending review (admin)", "Admin", { auth: true }),
    },
    "/admin/products/{productId}/approve": {
      patch: operation("Approve a product (admin)", "Admin", { auth: true, parameters: [{ ...id, name: "productId" }] }),
    },
    "/admin/products/{productId}/reject": {
      patch: operation("Reject a product (admin)", "Admin", { auth: true, parameters: [{ ...id, name: "productId" }] }),
    },
    "/admin/orders": {
      get: operation("List orders to process (admin)", "Admin", { auth: true }),
    },
    "/admin/orders/{orderId}/advance": {
      patch: operation("Advance an order fulfillment status (admin)", "Admin", { auth: true, parameters: [{ ...id, name: "orderId" }] }),
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Paste the access token only; Swagger UI adds the Bearer prefix." },
    },
    responses: {
      BadRequest: { description: "Invalid input or operation not allowed" },
      Unauthorized: { description: "Missing, invalid, or expired access token" },
    },
    schemas: {
      RegisterRequest: { type: "object", required: ["name", "email", "password"], properties: { name: { type: "string", minLength: 2, maxLength: 100 }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 8, maxLength: 72 } } },
      VerifyOtpRequest: { type: "object", required: ["email", "code"], properties: { email: { type: "string", format: "email" }, code: { type: "string", pattern: "^\\d{6}$" } } },
      LoginRequest: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string" } } },
      RefreshRequest: { type: "object", required: ["refreshToken"], properties: { refreshToken: { type: "string" } } },
      AddressInput: { type: "object", required: ["recipientName", "phone", "addressLine", "ward", "district", "city"], properties: { recipientName: { type: "string" }, phone: { type: "string" }, addressLine: { type: "string" }, ward: { type: "string" }, district: { type: "string" }, city: { type: "string" }, country: { type: "string", default: "Vietnam" }, isDefault: { type: "boolean" } } },
      CartItemInput: { type: "object", required: ["productId"], properties: { productId: { type: "string" }, variantId: { type: "string" }, quantity: { type: "integer", minimum: 1, maximum: 99 } } },
      StoreInput: { type: "object", required: ["name", "slug"], properties: { name: { type: "string" }, slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" }, description: { type: "string" }, logo: { type: "string", format: "uri", nullable: true }, banner: { type: "string", format: "uri", nullable: true } } },
      StoreUpdate: { type: "object", properties: { name: { type: "string" }, description: { type: "string" }, logo: { type: "string", format: "uri", nullable: true }, banner: { type: "string", format: "uri", nullable: true } } },
      CategoryInput: { type: "object", required: ["name", "slug"], properties: { name: { type: "string" }, slug: { type: "string" }, description: { type: "string" }, image: { type: "string", format: "uri", nullable: true }, parent: { type: "string", nullable: true }, sortOrder: { type: "integer" }, isActive: { type: "boolean" } } },
      ProductInput: { type: "object", required: ["name", "description", "category", "variants"], properties: { name: { type: "string" }, description: { type: "string" }, brand: { type: "string" }, category: { type: "string" }, images: { type: "array", items: { type: "object", required: ["url", "key"], properties: { url: { type: "string", format: "uri" }, key: { type: "string" }, alt: { type: "string" } } } }, variants: { type: "array", minItems: 1, items: { type: "object", required: ["sku", "price", "stock"], properties: { sku: { type: "string" }, name: { type: "string" }, price: { type: "number", minimum: 0 }, compareAtPrice: { type: "number", nullable: true }, stock: { type: "integer", minimum: 0 }, attributes: { type: "object", additionalProperties: { type: "string" } } } } } } },
    },
  },
};
