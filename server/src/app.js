const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middlewares/error.middleware");
const userRoutes = require("./routes/user.routes");
const storeRoutes = require("./routes/store.routes");
const adminRoutes = require("./routes/admin.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Fieldhouse API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", authRoutes);

app.use(errorHandler);

app.use("/api/v1/users", userRoutes);

app.use("/api/v1/stores", storeRoutes);

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/categories", categoryRoutes);

app.use("/api/v1/products", productRoutes);

module.exports = app;
