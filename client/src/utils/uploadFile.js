import { createProductImageUpload } from "../api/upload.api";

export const uploadProductImage = async ({ productId, file }) => {
  const { uploadUrl, key, publicUrl } = await createProductImageUpload({
    productId,
    file,
  });

  const response = await fetch(uploadUrl, {
    method: "PUT",

    headers: {
      "Content-Type": file.type,
    },

    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  return {
    url: publicUrl,
    key,
  };
};
