require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDatabase = require("../src/config/database");
const { User, Store, Category, Product } = require("../src/models");

const password = "Password123!";
const productData = [
  { store: "nike", category: "football", name: "Nike Mercurial Vapor", slug: "nike-mercurial-vapor", brand: "Nike", description: "Giày đá bóng nhẹ, hỗ trợ tăng tốc và đổi hướng trên sân cỏ.", price: 3490000, compareAtPrice: 3990000, stock: 32 },
  { store: "nike", category: "sportswear", name: "Nike Dri-FIT Academy", slug: "nike-dri-fit-academy", brand: "Nike", description: "Áo tập luyện thoáng khí với công nghệ Dri-FIT.", price: 890000, compareAtPrice: null, stock: 50 },
  { store: "adidas", category: "football", name: "Adidas Predator League", slug: "adidas-predator-league", brand: "Adidas", description: "Kiểm soát bóng tự tin với thiết kế dành cho những pha xử lý chính xác.", price: 2990000, compareAtPrice: 3390000, stock: 24 },
  { store: "adidas", category: "sportswear", name: "Adidas Tiro Training Jersey", slug: "adidas-tiro-training-jersey", brand: "Adidas", description: "Áo tập bóng đá cổ điển, nhẹ và dễ vận động.", price: 990000, compareAtPrice: null, stock: 40 },
];

async function seed() {
  try {
    await connectDatabase();
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await User.findOneAndUpdate(
      { email: "admin@fieldhouse.local" },
      { $setOnInsert: { name: "Fieldhouse Admin", email: "admin@fieldhouse.local", password: hashedPassword, role: "ADMIN", isVerified: true } },
      { upsert: true, new: true },
    );

    const categories = {};
    for (const [name, slug] of [["Bóng đá", "football"], ["Thời trang thể thao", "sportswear"], ["Chạy bộ", "running"], ["Phụ kiện", "accessories"]]) {
      categories[slug] = await Category.findOneAndUpdate(
        { slug },
        { $setOnInsert: { name, slug, description: `Sản phẩm ${name.toLowerCase()}`, isActive: true } },
        { upsert: true, new: true },
      );
    }

    const stores = {};
    for (const [key, name, slug] of [["nike", "Nike Official Store", "nike-official-store"], ["adidas", "Adidas Official Store", "adidas-official-store"]]) {
      const email = `${key}@fieldhouse.local`;
      const owner = await User.findOneAndUpdate(
        { email },
        { $setOnInsert: { name: `${key[0].toUpperCase()}${key.slice(1)} Seller`, email, password: hashedPassword, role: "SELLER", sellerStatus: "APPROVED", isVerified: true } },
        { upsert: true, new: true },
      );
      stores[key] = await Store.findOneAndUpdate(
        { owner: owner._id },
        { $setOnInsert: { owner: owner._id, name, slug, description: `Official ${key} sports store on Fieldhouse.`, status: "ACTIVE" } },
        { upsert: true, new: true },
      );
    }

    for (const item of productData) {
      await Product.findOneAndUpdate(
        { store: stores[item.store]._id, slug: item.slug },
        { $setOnInsert: {
          store: stores[item.store]._id,
          category: categories[item.category]._id,
          name: item.name,
          slug: item.slug,
          brand: item.brand,
          description: item.description,
          images: [],
          variants: [{ sku: item.slug.toUpperCase(), name: "Mặc định", price: item.price, compareAtPrice: item.compareAtPrice, stock: item.stock }],
          status: "ACTIVE",
        } },
        { upsert: true, new: true },
      );
    }

    console.log("Fieldhouse demo data is ready (existing records were kept).");
    console.log("Demo password for the admin and seller accounts: Password123!");
    console.log("Admin: admin@fieldhouse.local | Sellers: nike@fieldhouse.local, adidas@fieldhouse.local");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

seed();
