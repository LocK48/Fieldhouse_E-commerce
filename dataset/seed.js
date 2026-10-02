const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");

const root = path.resolve(__dirname, "..");
const serverRequire = createRequire(path.join(root, "server", "package.json"));
serverRequire("dotenv").config({ path: path.join(root, "server", ".env") });

const mongoose = serverRequire("mongoose");
const bcrypt = serverRequire("bcryptjs");
const { S3Client, PutObjectCommand, HeadObjectCommand } = serverRequire("@aws-sdk/client-s3");
const { User, Store, Category, Product } = serverRequire("./src/models");

const assetPath = path.join(root, "mercurial.webp");
const imageBytes = fs.readFileSync(assetPath);
const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
const bucket = process.env.R2_BUCKET_NAME;
const prefix = "fieldhouse-dataset-v1";
const sharedPassword = "DatasetTest123!";

const categoryData = [
  { name: "Football", slug: "football" },
  { name: "Sportswear", slug: "sportswear" },
  { name: "Running", slug: "running" },
  { name: "Accessories", slug: "accessories" },
];

const productLabels = [
  "Mercurial Vapor", "Predator League", "Dri-FIT Academy", "Tiro Training",
  "Ultraboost Light", "Gel-Kayano", "Phantom GX", "Copa Pure",
  "Training Essential", "Velocity Runner", "Court Vision", "Pro Match",
  "Everyday Crew", "Sprint Flex", "Club Fleece", "Power Lift",
  "Aero Strike", "Match Day", "Trail Pace", "Core Training",
  "Keeper Pro", "Classic Warmup", "Motion Short", "Studio Essential",
  "Performance Cap",
];
const brands = ["Nike", "Adidas", "Puma", "Asics", "Under Armour"];
const storesSpec = [
  { key: "northstar", name: "Northstar Athletics", slug: "northstar-athletics", userIndex: 1, brand: "Nike" },
  { key: "stride", name: "Stride Supply", slug: "stride-supply", userIndex: 2, brand: "Adidas" },
];

const users = Array.from({ length: 10 }, (_, index) => ({
  name: ["Minh Anh", "Gia Huy", "Ngọc Linh", "Tuấn Kiệt", "Thảo Vy", "Đức Minh", "Bảo Trân", "Quang Huy", "Khánh An", "Hoàng Long"][index],
  email: `dataset.user${String(index + 1).padStart(2, "0")}@fieldhouse.test`,
  role: index < 2 ? "SELLER" : "CUSTOMER",
  sellerStatus: index < 2 ? "APPROVED" : "NONE",
}));

const products = Array.from({ length: 50 }, (_, index) => {
  const store = storesSpec[Math.floor(index / 25)];
  const itemNumber = index + 1;
  return {
    name: `${store.brand} ${productLabels[index % productLabels.length]} ${String(Math.floor(index / productLabels.length) + 1).padStart(2, "0")}`,
    slug: `dataset-product-${String(itemNumber).padStart(3, "0")}`,
    brand: brands[index % brands.length],
    categorySlug: categoryData[index % categoryData.length].slug,
    storeKey: store.key,
    description: `Sản phẩm dữ liệu thử nghiệm ${String(itemNumber).padStart(3, "0")}, dùng để xác nhận kết nối Fieldhouse với MongoDB và Cloudflare R2.`,
    sku: `FH-DATA-${String(itemNumber).padStart(3, "0")}`,
    price: 450000 + ((index * 137000) % 4250000),
    compareAtPrice: 550000 + ((index * 137000) % 4250000),
    stock: 5 + ((index * 7) % 96),
    imageKey: `${prefix}/products/${String(itemNumber).padStart(3, "0")}-mercurial.webp`,
  };
});

const batches = (items, size = 5) => {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
};

async function main() {
  const required = ["MONGO_URI", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required configuration: ${missing.join(", ")}`);

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

  const passwordHash = await bcrypt.hash(sharedPassword, 12);
  const savedUsers = [];
  for (const [index, user] of users.entries()) {
    savedUsers.push(await User.findOneAndUpdate(
      { email: user.email },
      { $set: { ...user, password: passwordHash, isActive: true, isVerified: true } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    ));
  }

  const categoryBySlug = {};
  for (const category of categoryData) {
    categoryBySlug[category.slug] = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: { name: category.name, isActive: true } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
  }

  const storeByKey = {};
  for (const storeSpec of storesSpec) {
    const owner = savedUsers[storeSpec.userIndex - 1];
    storeByKey[storeSpec.key] = await Store.findOneAndUpdate(
      { slug: storeSpec.slug },
      { $set: { owner: owner._id, name: storeSpec.name, description: "Cửa hàng dữ liệu thử nghiệm Fieldhouse.", status: "ACTIVE" } },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
  }

  for (const batch of batches(products)) {
    await Promise.all(batch.map(async (product) => {
      await r2.send(new PutObjectCommand({
        Bucket: bucket,
        Key: product.imageKey,
        Body: imageBytes,
        ContentType: "image/webp",
        Metadata: { dataset: prefix, item: product.slug },
      }));
    }));
  }
  console.log(`R2 uploaded ${products.length} images under ${prefix}/products/`);

  for (const batch of batches(products)) {
    await Promise.all(batch.map(async (product) => {
      await Product.findOneAndUpdate(
        { store: storeByKey[product.storeKey]._id, slug: product.slug },
        { $set: {
          name: product.name,
          brand: product.brand,
          category: categoryBySlug[product.categorySlug]._id,
          description: product.description,
          images: [{ url: `${publicUrl}/${product.imageKey}`, key: product.imageKey, alt: product.name, sortOrder: 0 }],
          variants: [{ sku: product.sku, name: "Mặc định", price: product.price, compareAtPrice: product.compareAtPrice, stock: product.stock }],
          status: "ACTIVE",
        } },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
      );
    }));
  }

  for (const batch of batches(products)) {
    await Promise.all(batch.map((product) => r2.send(new HeadObjectCommand({ Bucket: bucket, Key: product.imageKey }))));
  }

  const savedUserCount = await User.countDocuments({ email: { $regex: /^dataset\.user\d{2}@fieldhouse\.test$/ } });
  const savedProductCount = await Product.countDocuments({ slug: /^dataset-product-\d{3}$/ });
  const savedStoreCount = await Store.countDocuments({ slug: { $in: storesSpec.map((store) => store.slug) } });
  if (savedUserCount !== 10 || savedProductCount !== 50 || savedStoreCount !== 2) {
    throw new Error(`MongoDB verification mismatch: users=${savedUserCount}, products=${savedProductCount}, stores=${savedStoreCount}`);
  }

  fs.writeFileSync(path.join(__dirname, "dataset.json"), JSON.stringify({
    name: "Fieldhouse connectivity dataset",
    generatedAt: new Date().toISOString(),
    credentials: { password: sharedPassword, note: "Synthetic local test accounts only." },
    users: users.map(({ name, email, role, sellerStatus }) => ({ name, email, role, sellerStatus })),
    stores: storesSpec.map(({ key, name, slug, userIndex }) => ({ key, name, slug, ownerEmail: users[userIndex - 1].email })),
    categories: categoryData,
    products: products.map(({ imageKey, ...product }) => ({ ...product, imageKey, imageUrl: `${publicUrl}/${imageKey}` })),
  }, null, 2));

  console.log(`Verified: ${savedUserCount} users, ${savedStoreCount} stores, ${savedProductCount} products in MongoDB.`);
  console.log(`Verified: ${products.length} R2 objects are readable by HEAD request.`);
  console.log(`Synthetic account password: ${sharedPassword}`);
  console.log(`Dataset manifest: ${path.join(__dirname, "dataset.json")}`);
}

main()
  .catch((error) => {
    console.error("Dataset upload failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
