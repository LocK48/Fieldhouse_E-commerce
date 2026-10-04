const express = require("express");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { Product } = require("../models");
const { getStorageClient } = require("../config/storage");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const key = typeof req.query.key === "string" ? req.query.key : "";
    const isAllowedKey =
      (key.startsWith("products/") ||
        key.startsWith("fieldhouse-dataset-v2/products/")) &&
      !key.split("/").includes("..");

    if (!isAllowedKey) {
      return res.status(400).json({ success: false, message: "Invalid image key" });
    }

    const product = await Product.exists({ status: "ACTIVE", "images.key": key });
    if (!product) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    const result = await getStorageClient().send(
      new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }),
    );

    res.set({
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Content-Type": result.ContentType || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    if (result.ContentLength != null) {
      res.set("Content-Length", String(result.ContentLength));
    }
    result.Body.pipe(res);
  }),
);

module.exports = router;
