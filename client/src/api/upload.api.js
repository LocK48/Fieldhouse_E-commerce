import api from "./axios";

export const createProductImageUpload = async ({ productId, file }) => {
  const response = await api.post("/uploads/products/presigned-url", {
    productId,

    fileName: file.name,

    contentType: file.type,

    fileSize: file.size,
  });

  return response.data.data;
};

export const deleteProductImage = async ({ productId, key }) => {
  const response = await api.delete(`/uploads/products/${productId}/image`, {
    data: {
      key,
    },
  });

  return response.data;
};
