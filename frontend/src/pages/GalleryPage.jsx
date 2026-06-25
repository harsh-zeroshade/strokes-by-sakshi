import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { productAPI } from '../api';
import { STORAGE_URL } from '../config';

function getImageUrl(product) {
  const url = product.primary_image?.image_url || product.thumbnail || product.image_url;
  if (!url) return null;
  return url.startsWith('http') ? url : `${STORAGE_URL}/${url}`;
}

export default function GalleryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await productAPI.all({ per_page: 20 });
        setProducts(data.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const types = ['all', 'original', 'print', 'limited_edition'];

  const filtered = filter === 'all'
    ? products
    : products.filter(p => p.product_type === filter);

  return (
    <div className="pt-24 min-h-screen">
      {/* Header */}
      <div className="px-4 py-12 sm:py-16 bg-cream/30">
        <div className="max-w-7xl mx-auto">
          <motion.span
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs uppercase tracking-[0.3em] text-charcoal-muted font-medium"
          >
            Lookbook
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-display text-charcoal"
          >
            Gallery
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-charcoal-muted max-w-xl"
          >
            A visual journey through original artworks, prints, and limited editions.
          </motion.p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${
                filter === t
                  ? 'bg-charcoal text-ivory'
                  : 'bg-cream text-charcoal-muted hover:bg-ivory-dark'
              }`}
            >
              {t === 'all' ? 'All Works' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {loading ? (
          <div className="columns-2 sm:columns-3 gap-4 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse break-inside-avoid mb-4">
                <div className={`rounded-xl bg-ivory-dark ${
                  i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[4/5]'
                }`} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-charcoal-muted">No artworks found.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 gap-4 space-y-4">
            {filtered.map((product, i) => {
              const imgUrl = getImageUrl(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 6) * 0.05 }}
                  className="break-inside-avoid mb-4"
                >
                  <Link to={`/shop/${product.slug}`} className="group block">
                    <div className={`rounded-xl bg-ivory-dark overflow-hidden relative ${
                      i % 3 === 0 ? 'aspect-[3/4]' : i % 3 === 1 ? 'aspect-square' : 'aspect-[4/5]'
                    }`}>
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt={product.primary_image?.alt_text || product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-cream flex items-center justify-center text-charcoal-muted text-lg font-display">
                          {product.name?.charAt(0)}
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-charcoal/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center gap-2 p-4">
                        <span className="text-ivory text-sm font-medium text-center">{product.name}</span>
                        <span className="text-ivory/70 text-xs uppercase tracking-wider">View Details</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
