import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistAPI } from '../../api';

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

export default function WishlistPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await wishlistAPI.all();
        setProducts(data.data || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await wishlistAPI.remove(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch {}
  };

  return (
    <div className="pt-24 min-h-screen px-4">
      <div className="max-w-4xl mx-auto py-12">
        <h1 className="text-3xl font-display text-charcoal mb-8">My Wishlist</h1>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-6">{[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-ivory-dark rounded-xl animate-pulse" />)}</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-charcoal-muted">Your wishlist is empty</p>
            <Link to="/shop" className="inline-block mt-4 text-sm text-terracotta hover:underline">Browse artworks</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <div key={product.id} className="group">
                <Link to={`/shop/${product.slug}`} className="block">
                  <div className="aspect-[3/4] rounded-xl bg-ivory-dark overflow-hidden">
                    <div className="w-full h-full bg-cream flex items-center justify-center text-charcoal-muted text-sm">{product.name?.charAt(0)}</div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-charcoal group-hover:text-terracotta transition-colors">{product.name}</h3>
                    <p className="text-sm text-terracotta mt-1">{formatPrice(product.price)}</p>
                  </div>
                </Link>
                <button onClick={() => handleRemove(product.id)} className="mt-2 text-xs text-charcoal-muted hover:text-error transition-colors">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}