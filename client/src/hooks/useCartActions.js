import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../api/cart.api";

export function useCartActions({ setCart, setBusy, setFeedback, confirm }) {
  async function refreshCart() {
    const cart = await getCart();
    setCart(cart);
    return cart;
  }

  async function putItemInCart(product, variantId) {
    try {
      setBusy(true);
      setCart(
        await addCartItem({ productId: product._id, variantId, quantity: 1 }),
      );
      setFeedback({ type: "success", text: "Đã thêm sản phẩm vào giỏ hàng." });
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason.message || "Không thể thêm sản phẩm vào giỏ.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function changeQuantity(item, quantity) {
    try {
      setBusy(true);
      setCart(
        await updateCartItem({
          productId: item.product._id,
          variantId: item.variant._id,
          quantity,
        }),
      );
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason.message || "Không thể cập nhật số lượng.",
      });
      try {
        await refreshCart();
      } catch {
        /* Keep the current cart visible. */
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(item) {
    try {
      setBusy(true);
      setCart(
        await removeCartItem({
          productId: item.product._id,
          variantId: item.variant?._id,
        }),
      );
    } catch (reason) {
      setFeedback({
        type: "error",
        text: reason.message || "Không thể xóa sản phẩm.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function emptyCart() {
    const accepted = await confirm({
      title: "Xóa toàn bộ giỏ hàng?",
      description: "Tất cả sản phẩm trong giỏ sẽ bị xóa.",
      confirmLabel: "Xóa tất cả",
    });
    if (!accepted) return;
    setBusy(true);
    try {
      setCart(await clearCart());
      setFeedback({
        type: "success",
        text: "Đã xóa toàn bộ sản phẩm khỏi giỏ hàng.",
      });
    } catch (reason) {
      setFeedback({
        type: "error",
        text:
          reason.response?.data?.message ||
          reason.message ||
          "Không thể xóa giỏ hàng.",
      });
    } finally {
      setBusy(false);
    }
  }

  return { refreshCart, putItemInCart, changeQuantity, deleteItem, emptyCart };
}
