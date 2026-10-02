import { useState } from "react";

import { uploadProductImage } from "../../utils/uploadFile";

import { deleteProductImage } from "../../api/upload.api";

export default function ProductImageUploader({ productId, images, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);

    if (!files.length) return;

    try {
      setUploading(true);

      const uploaded = await Promise.all(
        files.map((file) =>
          uploadProductImage({
            productId,
            file,
          }),
        ),
      );

      onChange([...images, ...uploaded]);
    } catch (error) {
      console.error(error);

      alert("Failed to upload image");
    } finally {
      setUploading(false);

      event.target.value = "";
    }
  };

  const handleDelete = async (key) => {
    try {
      await deleteProductImage({
        productId,
        key,
      });

      onChange(images.filter((image) => image.key !== key));
    } catch (error) {
      console.error(error);

      alert("Failed to delete image");
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        disabled={uploading}
      />

      {uploading && <p>Uploading...</p>}

      <div>
        {images.map((image) => (
          <div key={image.key}>
            <img src={image.url} alt={image.alt || ""} width={150} />

            <button type="button" onClick={() => handleDelete(image.key)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
