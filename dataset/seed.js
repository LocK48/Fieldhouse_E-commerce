const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const root = path.resolve(__dirname, "..");
const serverRequire = createRequire(path.join(root, "server", "package.json"));
serverRequire("dotenv").config({ path: path.join(root, "server", ".env") });

const mongoose = serverRequire("mongoose");
const bcrypt = serverRequire("bcryptjs");
const { S3Client, HeadObjectCommand } =
  serverRequire("@aws-sdk/client-s3");
const { User, Store, Category, Product } = serverRequire("./src/models");
const storageService = serverRequire("./src/services/storage.service");
const manifestPath = path.join(__dirname, "dataset.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
const bucket = process.env.R2_BUCKET_NAME;
const sharedPassword = manifest.credentials.password;

async function ensureAccountsAndStores() {
  const passwordHash = await bcrypt.hash(sharedPassword, 12);
  const usersByEmail = new Map();

  for (const userData of manifest.users) {
    const user = await User.findOneAndUpdate(
      { email: userData.email },
      {
        $setOnInsert: {
          ...userData,
          password: passwordHash,
          isActive: true,
          isVerified: true,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    if (user.role !== userData.role) {
      throw new Error(`Existing user role does not match dataset: ${userData.email}`);
    }
    usersByEmail.set(userData.email, user);
  }

  const demoPasswordHash = await bcrypt.hash("Password123!", 12);
  for (const userData of manifest.demoAccounts ?? []) {
    const existing = await User.findOne({ email: userData.email });
    if (existing && existing.role !== userData.role) {
      throw new Error(`Demo account role mismatch: ${userData.email}`);
    }
    const user = await User.findOneAndUpdate(
      { email: userData.email },
      {
        $set: {
          password: demoPasswordHash,
          isActive: true,
          isVerified: true,
        },
        $setOnInsert: userData,
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    usersByEmail.set(userData.email, user);
  }

  const storesByKey = new Map();
  for (const storeData of manifest.stores) {
    const owner = usersByEmail.get(storeData.ownerEmail);
    if (!owner || owner.role !== "SELLER") {
      throw new Error(`Seller account is missing or invalid: ${storeData.ownerEmail}`);
    }

    const existing = await Store.findOne({ slug: storeData.slug });
    if (existing) {
      if (String(existing.owner) !== String(owner._id)) {
        throw new Error(`Store owner mismatch; refusing to change seller: ${storeData.slug}`);
      }
      storesByKey.set(storeData.key, existing);
      continue;
    }

    const store = await Store.create({
      owner: owner._id,
      name: storeData.name,
      slug: storeData.slug,
      description: "Cửa hàng dữ liệu thử nghiệm Fieldhouse.",
      status: "ACTIVE",
    });
    storesByKey.set(storeData.key, store);
  }

  return { usersByEmail, storesByKey };
}

async function main() {
  const required = [
    "MONGO_URI",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required configuration: ${missing.join(", ")}`);
  if (!manifest.users.length || !manifest.stores.length || !manifest.products.length) {
    throw new Error("The dataset manifest must contain users, stores, and products.");
  }

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);

  const { usersByEmail, storesByKey } = await ensureAccountsAndStores();
  const categoriesBySlug = new Map();
  for (const categoryData of manifest.categories) {
    const category = await Category.findOneAndUpdate(
      { slug: categoryData.slug },
      { $set: { name: categoryData.name, isActive: true } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    categoriesBySlug.set(categoryData.slug, category);
  }

  for (const [index, product] of manifest.products.entries()) {
    const store = storesByKey.get(product.storeKey);
    const category = categoriesBySlug.get(product.categorySlug);
    const storeData = manifest.stores.find((item) => item.key === product.storeKey);
    if (!store || !category || !storeData) {
      throw new Error(`Invalid store or category for ${product.slug}`);
    }

    const savedProduct = await Product.findOneAndUpdate(
      { store: store._id, slug: product.slug },
      {
        $set: {
          name: product.name,
          brand: product.brand,
          category: category._id,
          description: product.description,
          variants: [{
            sku: product.sku,
            name: "Mặc định",
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            stock: product.stock,
          }],
          status: "ACTIVE",
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );

    const key = `products/${store._id}/${savedProduct._id}/${product.slug}.webp`;
    const imageBytes = fs.readFileSync(path.join(__dirname, product.imageFile));
    const uploadUrl = await storageService.createPresignedUpload({
      key,
      contentType: "image/webp",
    });
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/webp" },
      body: imageBytes,
    });
    if (!uploadResponse.ok) {
      throw new Error(`R2 upload failed for ${product.slug}: HTTP ${uploadResponse.status}`);
    }

    product.imageKey = key;
    product.imageUrl = `${publicUrl}/${key}`;
    await Product.updateOne(
      { _id: savedProduct._id },
      {
        $set: {
          images: [{
            url: product.imageUrl,
            key,
            alt: product.name,
            sortOrder: 0,
          }],
        },
      },
      { runValidators: true },
    );
    await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    console.log(
      `Uploaded ${index + 1}/${manifest.products.length}: ${product.slug} for ${storeData.ownerEmail}`,
    );
  }

  const userEmails = [
    ...manifest.users.map((user) => user.email),
    ...(manifest.demoAccounts ?? []).map((user) => user.email),
  ];
  const storeSlugs = manifest.stores.map((store) => store.slug);
  const productSlugs = manifest.products.map((product) => product.slug);
  const [savedUserCount, savedStoreCount, savedProductCount] = await Promise.all([
    User.countDocuments({ email: { $in: userEmails } }),
    Store.countDocuments({ slug: { $in: storeSlugs } }),
    Product.countDocuments({ slug: { $in: productSlugs } }),
  ]);
  if (
    savedUserCount !== userEmails.length ||
    savedStoreCount !== manifest.stores.length ||
    savedProductCount !== manifest.products.length
  ) {
    throw new Error(`MongoDB verification mismatch: users=${savedUserCount}, stores=${savedStoreCount}, products=${savedProductCount}`);
  }

  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Verified ${savedUserCount} users (including ${manifest.demoAccounts?.length ?? 0} demo accounts), ${savedStoreCount} stores, and ${savedProductCount} image-matched products.`);
  console.log(`Verified ${manifest.products.length} presigned uploads in R2 under products/.`);
  console.log("Existing users and store owners were left unchanged; missing demo accounts are inserted only when needed.");
  console.log(`Dataset manifest: ${manifestPath}`);
}

main()
  .catch((error) => {
    console.error("Dataset sync failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
