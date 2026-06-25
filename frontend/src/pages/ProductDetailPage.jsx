import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { productAPI } from '../api';
import { useCart } from '../context/CartContext';
import { STORAGE_URL } from '../config';

function getImageUrl(imgOrProduct) {
  const url = imgOrProduct?.image_url || imgOrProduct?.primary_image?.image_url || imgOrProduct?.thumbnail;
  if (!url) return null;
  return url.startsWith('http') ? url : `${STORAGE_URL}/${url}`;
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await productAPI.show(slug);
        setProduct(data.product);
        setRelated(data.related || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity, selectedVariant?.id || null);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 min-h-screen px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-[4/5] rounded-2xl bg-ivory-dark animate-pulse" />
            <div className="space-y-6">
              <div className="h-8 bg-ivory-dark rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-ivory-dark rounded w-1/3 animate-pulse" />
              <div className="h-24 bg-ivory-dark rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="pt-24 min-h-screen flex items-center justify-center"><p>Product not found</p></div>;
  }

  const currentPrice = product.price + (selectedVariant?.price_modifier || 0);

  return (
    <div className="pt-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-charcoal-muted mb-8">
          <Link to="/shop" className="hover:text-charcoal">Collection</Link>
          <span>/</span>
          <span className="text-charcoal">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/5] rounded-2xl bg-cream overflow-hidden relative">
              {product.images?.length > 0 ? (
                <img
                  src={getImageUrl(product.images[selectedImageIndex])}
                  alt={product.images[selectedImageIndex]?.alt_text || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto rounded-full bg-ivory-dark flex items-center justify-center text-charcoal-muted text-2xl font-display">
                      {product.name?.charAt(0)}
                    </div>
                    <p className="mt-4 text-sm text-charcoal-muted">{product.medium}</p>
                  </div>
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2 z-10">
                <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-ivory/90 text-charcoal font-medium">
                  {product.product_type?.replace('_', ' ')}
                </span>
                {!product.is_in_stock && (
                  <span className="text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-error/90 text-ivory font-medium">
                    Sold
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {product.images?.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={img.id || i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === i ? 'border-charcoal' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={img.alt_text || product.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display text-charcoal">{product.name}</h1>
              {product.collection && (
                <p className="mt-2 text-sm text-charcoal-muted">From the <span className="text-terracotta">{product.collection.name}</span> collection</p>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-display text-terracotta">{formatPrice(currentPrice)}</span>
              {product.compare_price && (
                <span className="text-lg text-charcoal-muted line-through">{formatPrice(product.compare_price)}</span>
              )}
              <span className="text-xs text-sage">incl. taxes</span>
            </div>

            {product.short_description && (
              <p className="text-lg text-charcoal-muted leading-relaxed">{product.short_description}</p>
            )}

            {product.description && (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-2">Description</h3>
                <p className="text-sm text-charcoal-muted leading-relaxed">{product.description}</p>
              </div>
            )}

            {product.story && (
              <div className="p-4 rounded-xl bg-cream/70 border border-border">
                <h3 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-2">The Story Behind This Piece</h3>
                <p className="text-sm text-charcoal italic">{product.story}</p>
              </div>
            )}

            {/* Variants */}
            {product.variants?.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium mb-3">Options</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'border-charcoal bg-charcoal text-ivory'
                          : 'border-border text-charcoal-muted hover:border-charcoal-muted'
                      }`}
                    >
                      {variant.name}
                      {variant.price_modifier > 0 && ` (+${formatPrice(variant.price_modifier)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Materials & Details */}
            <div className="grid grid-cols-2 gap-4">
              {product.medium && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium">Medium</h4>
                  <p className="text-sm text-charcoal mt-1">{product.medium}</p>
                </div>
              )}
              {product.surface && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium">Surface</h4>
                  <p className="text-sm text-charcoal mt-1">{product.surface}</p>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium">Dimensions</h4>
                  <p className="text-sm text-charcoal mt-1">{product.width_cm} x {product.height_cm} cm</p>
                </div>
              )}
              {product.orientation && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-charcoal-muted font-medium">Orientation</h4>
                  <p className="text-sm text-charcoal mt-1 capitalize">{product.orientation}</p>
                </div>
              )}
            </div>

            {/* Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-sm hover:bg-cream transition-colors">−</button>
                <span className="px-4 py-3 text-sm font-medium">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="px-4 py-3 text-sm hover:bg-cream transition-colors">+</button>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddToCart}
                disabled={!product.is_in_stock}
                className={`flex-1 py-3 px-6 rounded-lg text-sm uppercase tracking-wider font-medium transition-all ${
                  addedToCart
                    ? 'bg-sage text-ivory'
                    : 'bg-charcoal text-ivory hover:bg-charcoal-light'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {addedToCart ? '✓ Added to Cart' : product.is_in_stock ? 'Add to Cart' : 'Currently Unavailable'}
              </motion.button>
            </div>

            {/* Commission CTA */}
            <Link
              to="/commission"
              className="block text-center py-3 px-6 border-2 border-border rounded-lg text-sm text-charcoal-muted hover:border-charcoal/30 hover:text-charcoal transition-all"
            >
              Commission a piece in this style →
            </Link>
          </div>
        </div>
      </div>

      {/* Related Works */}
      {related.length > 0 && (
        <section className="mt-24 px-4 py-16 bg-cream/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display text-charcoal mb-10">Related Works</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link to={`/shop/${item.slug}`} className="group block">
                    <div className="aspect-[3/4] rounded-xl bg-ivory-dark overflow-hidden">
                      {getImageUrl(item) ? (
                        <img
                          src={getImageUrl(item)}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-cream flex items-center justify-center text-charcoal-muted text-sm">
                          {item.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="text-sm font-medium text-charcoal group-hover:text-terracotta transition-colors">{item.name}</h3>
                      <p className="text-sm text-terracotta mt-1">{formatPrice(item.price)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}