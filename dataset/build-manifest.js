const fs = require("node:fs");
const path = require("node:path");

const datasetPath = path.join(__dirname, "dataset.json");
const manifest = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const imageRoot = path.join(__dirname, "img");
const categoryNames = {
  football: { name: "Football", slug: "football" },
  sportwear: { name: "Sportswear", slug: "sportswear" },
  running: { name: "Running", slug: "running" },
  basketball: { name: "Basketball", slug: "basketball" },
  accessories: { name: "Accessories", slug: "accessories" },
};
const categoryOrder = ["football", "sportwear", "running", "basketball", "accessories"];
const nameOverrides = {
  "Adidas Preadator League.webp": "Adidas Predator League",
  "NIke Air Force 1 Tech Essential.webp": "Nike Air Force 1 Tech Essential",
};
const basePrice = {
  football: 1_790_000,
  sportwear: 390_000,
  running: 1_390_000,
  basketball: 1_490_000,
  accessories: 290_000,
};
const descriptionByCategory = {
  football: "Sản phẩm bóng đá dành cho buổi tập và thi đấu, được chọn từ bộ ảnh Fieldhouse.",
  sportwear: "Trang phục thể thao thoải mái, phù hợp cho luyện tập và sử dụng hằng ngày.",
  running: "Sản phẩm hỗ trợ vận động và chạy bộ, cân bằng giữa sự thoải mái và độ bền.",
  basketball: "Sản phẩm cho luyện tập, di chuyển và vận động trên sân bóng rổ.",
  accessories: "Phụ kiện thể thao thiết yếu, tiện dụng cho luyện tập và sinh hoạt hằng ngày.",
};
const storeKeys = new Set(manifest.stores.map((store) => store.key));
const imageFolders = new Set(fs.readdirSync(imageRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name));

const slugify = (value) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

let products = [];
for (const folder of categoryOrder) {
  if (!imageFolders.has(folder)) continue;
  const files = fs.readdirSync(path.join(imageRoot, folder), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".webp"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"));

  for (const fileName of files) {
    const index = products.length;
    const imageName = path.parse(fileName).name;
    const name = nameOverrides[fileName] || imageName;
    const brand = name.match(/^(Nike|Adidas|Puma|Asics|Under Armour)\b/i)?.[1] || "Fieldhouse";
    const storeKey = brand === "Nike"
      ? "northstar"
      : brand === "Adidas"
        ? "stride"
        : (index % 2 === 0 ? "northstar" : "stride");
    if (!storeKeys.has(storeKey)) throw new Error(`Missing store in dataset.json: ${storeKey}`);

    const price = basePrice[folder] + ((index * 137_000) % 6) * 125_000;
    const slug = slugify(name);
    products.push({
      name,
      slug: `image-product-${String(index + 1).padStart(3, "0")}-${slug}`,
      brand,
      categorySlug: categoryNames[folder].slug,
      storeKey,
      description: descriptionByCategory[folder],
      sku: `FH-IMG-${String(index + 1).padStart(3, "0")}`,
      price,
      compareAtPrice: price + 150_000 + (index % 3) * 50_000,
      stock: 8 + ((index * 7) % 43),
      imageFile: `img/${folder}/${fileName}`,
      imageKey: `fieldhouse-dataset-v2/products/${String(index + 1).padStart(3, "0")}-${slug}.webp`,
      imageUrl: "",
    });
  }
}

if (!products.length) throw new Error(`No WebP images found under ${imageRoot}`);

const categories = [...manifest.categories];
for (const folder of categoryOrder) {
  const category = categoryNames[folder];
  if (imageFolders.has(folder) && !categories.some((item) => item.slug === category.slug)) {
    categories.push(category);
  }
}

fs.writeFileSync(datasetPath, `${JSON.stringify({
  ...manifest,
  name: "Fieldhouse image product dataset",
  generatedAt: new Date().toISOString(),
  categories,
  products,
}, null, 2)}\n`);

console.log(`Created ${products.length} product records from dataset/img.`);
console.log(`Preserved ${manifest.users.length} users and ${manifest.stores.length} sellers/stores.`);
