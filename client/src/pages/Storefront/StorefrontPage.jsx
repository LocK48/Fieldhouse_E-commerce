import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicStore } from "../../api/store.api";
import ProductCard from "../../components/product/ProductCard";

export default function StorefrontPage({ productImage, onOpenProduct, onOpenChat }) {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPublicStore(slug)
      .then((result) => { if (active) { setStore(result.store); setProducts(result.products || []); } })
      .catch((reason) => { if (active) setError(reason.response?.data?.message || reason.message || "Không tải được cửa hàng."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (loading) return <main className="storefront-page"><div className="skeleton dashboard-skeleton" /></main>;
  if (error || !store) return <main className="storefront-page"><div className="empty-state"><h1>Không tìm thấy cửa hàng</h1><p>{error}</p></div></main>;

  return <main className="storefront-page">
    <section className="storefront-hero" style={store.banner ? { backgroundImage: `linear-gradient(90deg,#18251ee8,#18251e33),url(${store.banner})` } : undefined}>
      <div className="storefront-avatar">{store.logo ? <img src={store.logo} alt="" /> : <span>{store.name.slice(0,1)}</span>}</div>
      <div className="storefront-info"><small>FIELDHOUSE SELLER</small><h1>{store.name}</h1><p>{store.description || `Cửa hàng chính thức của ${store.owner?.name || store.name}.`}</p><span>Chủ cửa hàng · {store.owner?.name || "Seller"}</span></div>
      <button className="storefront-chat-button" onClick={() => onOpenChat(store._id)}>Nhắn tin cho shop <span>↗</span></button>
    </section>
    <section className="storefront-products"><header><div><p className="eyebrow">SHOP COLLECTION</p><h2>Sản phẩm <em>của shop.</em></h2></div><span>{products.length} sản phẩm</span></header>
      {products.length ? <div className="product-grid">{products.map((product, index) => <ProductCard key={product._id} product={product} index={index} productImage={productImage} onOpenProduct={onOpenProduct} />)}</div> : <div className="empty-state"><h3>Shop đang cập nhật sản phẩm</h3><p>Quay lại sau để khám phá bộ sưu tập mới.</p></div>}
    </section>
  </main>;
}
