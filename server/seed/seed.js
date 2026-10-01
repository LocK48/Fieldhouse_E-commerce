require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDatabase = require("../src/config/database");

const { User, Store, Category, Product } = require("../src/models");

const seedDatabase = async () => {
  try {
    await connectDatabase();

    console.log("Clearing database...");

    await User.deleteMany({});
    await Store.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log("Creating users...");

    const password = await bcrypt.hash("Password123!", 12);

    const admin = await User.create({
      name: "Fieldhouse Admin",
      email: "admin@fieldhouse.local",
      password,
      role: "ADMIN",
      isVerified: true,
    });

    const seller1 = await User.create({
      name: "Nike Seller",
      email: "nike@fieldhouse.local",
      password,
      role: "SELLER",
      isVerified: true,
    });

    const seller2 = await User.create({
      name: "Adidas Seller",
      email: "adidas@fieldhouse.local",
      password,
      role: "SELLER",
      isVerified: true,
    });

    console.log("Users created.");

    console.log("Creating stores...");

    const nikeStore = await Store.create({
      owner: seller1._id,
      name: "Nike Official Store",
      slug: "nike-official-store",
      description: "Official Nike sports store on Fieldhouse.",
      status: "ACTIVE",
    });

    const adidasStore = await Store.create({
      owner: seller2._id,
      name: "Adidas Official Store",
      slug: "adidas-official-store",
      description: "Official Adidas sports store on Fieldhouse.",
      status: "ACTIVE",
    });

    console.log("Stores created.");

    console.log("Creating categories...");

    const categories = await Category.insertMany([
      {
        name: "Football",
        slug: "football",
        description: "Football products",
      },
      {
        name: "Basketball",
        slug: "basketball",
        description: "Basketball products",
      },
      {
        name: "Running",
        slug: "running",
        description: "Running products",
      },
      {
        name: "Sportswear",
        slug: "sportswear",
        description: "Sports clothing",
      },
      {
        name: "Accessories",
        slug: "accessories",
        description: "Sports accessories",
      },
    ]);

    console.log("Categories created.");

    console.log("Creating products...");

    const footballCategory = categories.find(
      (category) => category.slug === "football",
    );

    const sportswearCategory = categories.find(
      (category) => category.slug === "sportswear",
    );

    const products = await Product.insertMany([
      {
        store: nikeStore._id,
        category: footballCategory._id,
        name: "Nike Mercurial Vapor",
        slug: "nike-mercurial-vapor",
        description: "High-performance football boots.",
        price: 149.99,
        images: [],
        stock: 50,
        status: "ACTIVE",
      },

      {
        store: nikeStore._id,
        category: sportswearCategory._id,
        name: "Nike Dri-FIT Academy",
        slug: "nike-dri-fit-academy",
        description: "Lightweight football training jersey.",
        price: 49.99,
        images: [],
        stock: 100,
        status: "ACTIVE",
      },

      {
        store: adidasStore._id,
        category: footballCategory._id,
        name: "Adidas Predator",
        slug: "adidas-predator",
        description: "Professional football boots.",
        price: 159.99,
        images: [],
        stock: 40,
        status: "ACTIVE",
      },

      {
        store: adidasStore._id,
        category: sportswearCategory._id,
        name: "Adidas Tiro Jersey",
        slug: "adidas-tiro-jersey",
        description: "Classic football training jersey.",
        price: 44.99,
        images: [],
        stock: 80,
        status: "ACTIVE",
      },
    ]);

    console.log(`${products.length} products created.`);

    console.log("\nSeed completed successfully.");
    console.log("--------------------------------");
    console.log("Admin:");
    console.log("Email: admin@fieldhouse.local");
    console.log("Password: Password123!");
    console.log("--------------------------------");
    console.log("Seller 1:");
    console.log("Email: nike@fieldhouse.local");
    console.log("Password: Password123!");
    console.log("--------------------------------");
    console.log("Seller 2:");
    console.log("Email: adidas@fieldhouse.local");
    console.log("Password: Password123!");
    console.log("--------------------------------");

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedDatabase();
