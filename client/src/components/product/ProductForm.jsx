import { useState } from "react";
import { createProduct, updateProduct } from "../../api/product.api";
import { uploadProductImage } from "../../utils/uploadFile";
import ProductImageUploader from "./ProductImageUploader";

const makeInitialState = (product) => ({
  name: product?.name || "",
  description: product?.description || "",
  brand: product?.brand || "",
  category: product?.category?._id || product?.category || "",
  sku: product?.variants?.[0]?.sku || "",
  price: product?.variants?.[0]?.price ?? "",
  stock: product?.variants?.[0]?.stock ?? 0,
});

export default function ProductForm({ categories = [], product, onSaved }) {
  const [form, setForm] = useState(() => makeInitialState(product));
  const [images, setImages] = useState(product?.images || []);
  const [newFiles, setNewFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        brand: form.brand.trim(),
        category: form.category,
        images,
        variants: [{ sku: form.sku.trim(), price: Number(form.price), stock: Number(form.stock) }],
      };
      const saved = product?._id ? await updateProduct(product._id, payload) : await createProduct(payload);
      let result = saved;
      if (newFiles.length) {
        const uploaded = await Promise.all(newFiles.map((file) => uploadProductImage({ productId: saved._id, file })));
        result = await updateProduct(saved._id, { images: [...images, ...uploaded] });
        setImages(result.images || [...images, ...uploaded]);
        setNewFiles([]);
      }
      onSaved?.(result);
    } catch (reason) {
      setError(reason.response?.data?.message || reason.message || "Không thể lưu sản phẩm.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      {error && <p role="alert">{error}</p>}
      <label>Tên sản phẩm<input name="name" value={form.name} onChange={updateField} required maxLength={200} /></label>
      <label>Mô tả<textarea name="description" value={form.description} onChange={updateField} required maxLength={5000} rows={4} /></label>
      <label>Thương hiệu<input name="brand" value={form.brand} onChange={updateField} maxLength={100} /></label>
      <label>Danh mục<select name="category" value={form.category} onChange={updateField} required><option value="">Chọn danh mục</option>{categories.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
      <fieldset><legend>Phiên bản mặc định</legend><label>SKU<input name="sku" value={form.sku} onChange={updateField} required /></label><label>Giá (₫)<input name="price" type="number" min="0" step="1000" value={form.price} onChange={updateField} required /></label><label>Tồn kho<input name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateField} required /></label></fieldset>
      {product?._id ? <ProductImageUploader productId={product._id} images={images} onChange={setImages} /> : <label>Ảnh sản phẩm<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setNewFiles(Array.from(event.target.files || []))} /><small>Ảnh sẽ được tải lên sau khi tạo sản phẩm. Tối đa 5 MB mỗi ảnh.</small></label>}
      <button type="submit" disabled={saving}>{saving ? "Đang lưu…" : product?._id ? "Lưu thay đổi" : "Tạo sản phẩm"}</button>
    </form>
  );
}
