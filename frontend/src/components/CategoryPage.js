import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchProductsByCategory } from "../api";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const CategoryPage = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const safeCategory = useMemo(() => decodeURIComponent(category || ""), [category]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    fetchProductsByCategory(safeCategory)
      .then((payload) => {
        if (!isMounted) return;
        setProducts(payload?.products ?? []);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("We couldn't load products for this category right now. Please try again later.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [safeCategory]);

  if (loading) {
    return <div>Loading {safeCategory} products…</div>;
  }

  if (error) {
    return <div role="alert">{error}</div>;
  }

  if (!products.length) {
    return <div>No products found in {safeCategory}.</div>;
  }

  return (
    <div>
      <h1>{safeCategory} Products</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
        {products.map((product) => (
          <article
            key={`${product.title}-${product.price}`}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "16px",
              width: "260px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}
          >
            <img
              src={product.image_url}
              alt={product.title}
              style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "4px" }}
              loading="lazy"
            />
            <h2 style={{ fontSize: "1.1rem", margin: "12px 0 8px" }}>{product.title}</h2>
            <p style={{ fontWeight: 600 }}>{currencyFormatter.format(product.price ?? 0)}</p>
            <button
              type="button"
              onClick={() => window.alert(`Add ${product.title} to cart`)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "#1976d2",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Buy
            </button>
          </article>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;
