import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { productAPI } from '../api';
import { resolveProductImage } from '../utils/imageUrl';

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    type: searchParams.get('type') || '',
    min_price: '',
    max_price: '',
    medium: searchParams.get('medium') || '',
    orientation: '',
    sort: 'newest',
  });
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
        params.per_page = 12;
        const { data } = await productAPI.all(params);
        setProducts(data.data || []);
        setMeta(data.meta || {});
        
        if (categories.length === 0) {
          const { data: cats } = await productAPI.categories();
          setCategories(Array.isArray(cats) ? cats : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', type: '', min_price: '', max_price: '', medium: '', orientation: '', sort: 'newest' });
  };

  const hasFilters = Object.values(filters).some(v => v && v !== 'newest');

  return (
    <div className="pt-24 sm:pt-28 dark:bg-[#1A1814]">
      {/* Page Header */}
      <div className="px-4 py-12 sm:py-16 bg-cream/30 dark:bg-[#252219]/50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display text-charcoal">Collection</h1>
          <p className="mt-4 text-lg text-charcoal-muted max-w-xl">Original artworks, limited editions, and museum-quality prints.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              <div>
                <h3 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => updateFilter('category', filters.category === cat.slug ? '' : cat.slug)}
                      className={`block w-full text-left text-sm py-1.5 transition-colors ${
                        filters.category === cat.slug ? 'text-terracotta font-medium' : 'text-charcoal-muted hover:text-charcoal'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-4">Artwork Type</h3>
                <div className="space-y-2">
                  {[
                    { value: 'original', label: 'Original Art' },
                    { value: 'print', label: 'Prints' },
                    { value: 'limited_edition', label: 'Limited Editions' },
                  ].map(type => (
                    <button
                      key={type.value}
                      onClick={() => updateFilter('type', filters.type === type.value ? '' : type.value)}
                      className={`block w-full text-left text-sm py-1.5 transition-colors ${
                        filters.type === type.value ? 'text-terracotta font-medium' : 'text-charcoal-muted hover:text-charcoal'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-3">Sort By</h4>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-sm text-charcoal focus:outline-none focus:border-charcoal-muted"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                </select>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-3">Price Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_price}
                    onChange={(e) => updateFilter('min_price', e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-sm text-charcoal focus:outline-none focus:border-charcoal-muted"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_price}
                    onChange={(e) => updateFilter('max_price', e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-border rounded-lg text-sm text-charcoal focus:outline-none focus:border-charcoal-muted"
                  />
                </div>
              </div>

              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-terracotta hover:text-terracotta-dark uppercase tracking-wider">
                  Clear All Filters
                </button>
              )}
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-charcoal-muted">{meta.total || products.length} artworks</p>
            </div>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] rounded-xl bg-ivory-dark" />
                    <div className="mt-3 h-4 bg-ivory-dark rounded w-3/4" />
                    <div className="mt-2 h-3 bg-ivory-dark rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-charcoal-muted">No artworks found matching your criteria.</p>
                <button onClick={clearFilters} className="mt-4 text-sm text-terracotta hover:underline">Clear filters</button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link to={`/shop/${product.slug}`} className="group block">
                      <div className="aspect-[3/4] rounded-xl bg-ivory-dark overflow-hidden relative">
                        {resolveProductImage(product) ? (
                          <img
                            src={resolveProductImage(product)}
                            alt={product.primary_image?.alt_text || product.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-cream flex items-center justify-center text-charcoal-muted text-sm">
                            {product.name?.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                        <div className="absolute top-3 left-3 z-20">
                          <span className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-ivory/90 text-charcoal-muted font-medium">
                            {product.product_type?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <h3 className="text-sm font-medium text-charcoal group-hover:text-terracotta transition-colors">{product.name}</h3>
                        {product.short_description && (
                          <p className="text-xs text-charcoal-muted line-clamp-1">{product.short_description}</p>
                        )}
                        {product.medium && <p className="text-xs text-charcoal-muted">{product.medium}</p>}
                        <p className="text-sm font-medium text-terracotta">{formatPrice(product.price)}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {meta.last_page > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                {[...Array(meta.last_page)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateFilter('page', i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm transition-colors ${
                      meta.current_page === i + 1 ? 'bg-charcoal text-ivory' : 'text-charcoal-muted hover:bg-cream'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}