import { useState, useEffect, useCallback } from 'react';
import { adminAPI, productAPI } from '../../api';
import AdminLayout, { AdminCard, Badge } from './AdminLayout';
import { STORAGE_URL } from '../../config';

function formatINR(v) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);
}

function getImg(product) {
  const url = product.primary_image?.image_url || product.thumbnail;
  if (!url) return null;
  return url.startsWith('http') ? url : `${STORAGE_URL}/${url}`;
}

const EMPTY_FORM = {
  name: '', slug: '', description: '', short_description: '', price: '',
  compare_price: '', product_type: 'original', category_id: '', medium: '',
  orientation: 'portrait', width_cm: '', height_cm: '', stock_quantity: 1,
  is_featured: false, is_active: true,
};

export function AdminProductsList() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [images, setImages]         = useState([]);    // new files to upload
  const [existingImages, setExistingImages] = useState([]); // current DB images
  const [replaceImages, setReplaceImages]   = useState(true); // replace vs append
  const [saving, setSaving]         = useState(false);
  const [msg, setMsg]               = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminAPI.products(), productAPI.categories()])
      .then(([{ data: p }, { data: c }]) => {
        setProducts(p.data || []);
        setCategories(Array.isArray(c) ? c : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setImages([]); setExistingImages([]);
    setReplaceImages(true); setMsg('');
    setModal('new');
  };

  const openEdit = async (p) => {
    setForm({
      name: p.name, slug: p.slug, description: p.description || '',
      short_description: p.short_description || '', price: p.price,
      compare_price: p.compare_price || '', product_type: p.product_type,
      category_id: p.category_id || '', medium: p.medium || '',
      orientation: p.orientation || 'portrait', width_cm: p.width_cm || '',
      height_cm: p.height_cm || '', stock_quantity: p.stock_quantity ?? 1,
      is_featured: p.is_featured, is_active: p.is_active,
    });
    setImages([]); setMsg('');
    setReplaceImages(true);
    setModal(p);

    // Fetch full images list for this product
    try {
      const { data } = await adminAPI.showProduct(p.id);
      setExistingImages(data.images || []);
    } catch {
      setExistingImages(p.images || []);
    }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const autoSlug = (name) => {
    if (!modal || modal === 'new') {
      set('slug', name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      const isNew = modal === 'new';
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (typeof v === 'boolean') fd.append(k, v ? '1' : '0');
        else if (v !== '' && v != null) fd.append(k, v);
      });
      images.forEach(f => fd.append('images[]', f));

      if (!isNew && images.length > 0) {
        fd.append('replace_images', replaceImages ? '1' : '0');
      }

      if (isNew) {
        await adminAPI.createProduct(fd);
        setMsg('Product created!');
      } else {
        await adminAPI.updateProduct(modal.id, fd);
        setMsg('Product updated!');
      }
      load();
      setTimeout(() => setModal(null), 1000);
    } catch (e) {
      const errors = e.response?.data?.errors;
      const errMsg = errors
        ? Object.values(errors).flat().join(' ')
        : e.response?.data?.message || 'Error saving product';
      setMsg(errMsg);
    } finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    await adminAPI.deleteProduct(id).catch(() => {});
    load();
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Products">
      {({ dark }) => (
        <>
          <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="flex items-center gap-2 flex-1 min-w-[180px] max-w-sm px-3 py-2 rounded-lg"
                style={{ background: dark ? '#1f2937' : '#fff', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}` }}
              >
                <span className="material-symbols-rounded text-base" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>search</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
                  className="bg-transparent outline-none text-sm w-full" style={{ color: dark ? '#F1F5F9' : '#1F2936' }} />
              </div>
              <button
                onClick={openNew}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: '#c7694f' }}
              >
                <span className="material-symbols-rounded text-base">add</span>
                New Product
              </button>
            </div>

            {/* Grid */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading
                ? [...Array(6)].map((_, i) => (
                    <div key={i} className="h-56 rounded-xl animate-pulse" style={{ background: dark ? '#1f2937' : '#fff' }} />
                  ))
                : filtered.map(product => {
                    const img = getImg(product);
                    return (
                      <div
                        key={product.id}
                        className="rounded-xl overflow-hidden flex flex-col"
                        style={{ background: dark ? '#1f2937' : '#fff', boxShadow: `0 1px 4px ${dark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.07)'}` }}
                      >
                        {/* Image */}
                        <div className="aspect-[4/3] overflow-hidden bg-gray-100 flex-shrink-0">
                          {img
                            ? <img src={img} alt={product.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-2xl font-display" style={{ color: '#c7694f', background: '#FEF3E2' }}>
                                {product.name?.charAt(0)}
                              </div>
                          }
                        </div>
                        {/* Info */}
                        <div className="flex-1 px-4 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight">{product.name}</p>
                            <Badge status={product.is_active ? 'active' : 'inactive'} />
                          </div>
                          <p className="text-xs mt-1 capitalize" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                            {product.product_type?.replace(/_/g, ' ')} · {product.medium}
                          </p>
                          <p className="text-base font-semibold mt-2 text-terracotta">{formatINR(product.price)}</p>
                        </div>
                        {/* Actions */}
                        <div className="flex border-t" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                          <button
                            onClick={() => openEdit(product)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
                            style={{ color: dark ? '#A6B7D2' : '#798EAE' }}
                          >
                            <span className="material-symbols-rounded text-base">edit</span> Edit
                          </button>
                          <div className="w-px" style={{ background: dark ? '#3B475C' : '#E2E8F0' }} />
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-500 transition-colors"
                          >
                            <span className="material-symbols-rounded text-base">delete</span> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
              }
            </div>
            {!loading && !filtered.length && (
              <p className="text-center py-16 text-sm" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>No products found</p>
            )}
          </div>

          {/* ── Product modal ─────────────────────────────────────────── */}
          {modal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
                style={{ background: dark ? '#1f2937' : '#fff' }}
              >
                <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ background: dark ? '#1f2937' : '#fff', borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                  <h2 className="text-base font-semibold">{modal === 'new' ? 'New Product' : `Edit: ${modal.name}`}</h2>
                  <button onClick={() => setModal(null)} className="material-symbols-rounded text-xl" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>close</button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {[
                    { label: 'Product Name', key: 'name', type: 'text', onChange: v => { set('name', v); autoSlug(v); } },
                    { label: 'Slug', key: 'slug', type: 'text' },
                    { label: 'Price (₹)', key: 'price', type: 'number' },
                    { label: 'Compare Price (₹)', key: 'compare_price', type: 'number' },
                    { label: 'Stock Quantity', key: 'stock_quantity', type: 'number' },
                    { label: 'Medium', key: 'medium', type: 'text' },
                    { label: 'Width (cm)', key: 'width_cm', type: 'number' },
                    { label: 'Height (cm)', key: 'height_cm', type: 'number' },
                  ].map(({ label, key, type, onChange }) => (
                    <div key={key}>
                      <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{label}</label>
                      <input
                        type={type} value={form[key]} onChange={e => onChange ? onChange(e.target.value) : set(key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`, color: dark ? '#F1F5F9' : '#1F2936' }}
                      />
                    </div>
                  ))}

                  {/* Selects */}
                  {[
                    { label: 'Product Type', key: 'product_type', opts: ['original','print','commission','limited_edition'] },
                    { label: 'Orientation', key: 'orientation', opts: ['portrait','landscape','square'] },
                  ].map(({ label, key, opts }) => (
                    <div key={key}>
                      <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>{label}</label>
                      <select value={form[key]} onChange={e => set(key, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`, color: dark ? '#F1F5F9' : '#1F2936' }}>
                        {opts.map(o => <option key={o} value={o}>{o.replace(/_/g,' ')}</option>)}
                      </select>
                    </div>
                  ))}

                  {/* Category */}
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>Category</label>
                    <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`, color: dark ? '#F1F5F9' : '#1F2936' }}>
                      <option value="">No category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>Description</label>
                    <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                      style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`, color: dark ? '#F1F5F9' : '#1F2936' }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wider mb-1.5 block" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>Short Description</label>
                    <textarea rows={2} value={form.short_description} onChange={e => set('short_description', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                      style={{ background: dark ? '#3D4859' : '#F9FAFB', border: `1px solid ${dark ? '#3B475C' : '#E2E8F0'}`, color: dark ? '#F1F5F9' : '#1F2936' }} />
                  </div>

                  {/* Toggles */}
                  {[
                    { key: 'is_active', label: 'Active (visible in shop)' },
                    { key: 'is_featured', label: 'Featured (show on homepage)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => set(key, !form[key])}
                        className="relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer"
                        style={{ background: form[key] ? '#c7694f' : dark ? '#3D4859' : '#D1D5DB' }}
                      >
                        <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                          style={{ left: '4px', transform: form[key] ? 'translateX(16px)' : 'none' }} />
                      </div>
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}

                  {/* ── Images section ── */}
                  <div className="space-y-3">
                    <label className="text-xs font-medium uppercase tracking-wider block" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                      Product Images
                    </label>

                    {/* Current images (edit mode) */}
                    {modal !== 'new' && existingImages.length > 0 && (
                      <div>
                        <p className="text-xs mb-2" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                          Current images ({existingImages.length}):
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {existingImages.map((img, i) => (
                            <div key={i} className="relative group">
                              <img
                                src={img.image_url}
                                alt={img.alt_text || ''}
                                className="w-20 h-20 rounded-lg object-cover border"
                                style={{ borderColor: img.is_primary ? '#c7694f' : dark ? '#3B475C' : '#E2E8F0',
                                         borderWidth: img.is_primary ? 2 : 1 }}
                              />
                              {img.is_primary && (
                                <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] bg-terracotta text-white rounded px-1">
                                  Primary
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upload new images */}
                    <div
                      className="border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors"
                      style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}
                      onClick={() => document.getElementById('img-upload').click()}
                    >
                      <span className="material-symbols-rounded text-3xl block mb-1" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                        upload
                      </span>
                      <p className="text-xs" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                        Click to select images (JPG, PNG, WebP)
                      </p>
                      <input
                        id="img-upload"
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={e => setImages(Array.from(e.target.files))}
                      />
                    </div>

                    {/* Preview new images */}
                    {images.length > 0 && (
                      <div>
                        <p className="text-xs mb-2" style={{ color: dark ? '#A6B7D2' : '#798EAE' }}>
                          New images to upload ({images.length}):
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {images.map((f, i) => (
                            <div key={i} className="relative">
                              <img
                                src={URL.createObjectURL(f)}
                                alt=""
                                className="w-20 h-20 rounded-lg object-cover border-2 border-terracotta"
                              />
                              <button
                                onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center"
                              >✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Replace vs append toggle (edit mode only) */}
                    {modal !== 'new' && images.length > 0 && (
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{ background: dark ? '#3D4859' : '#FEF3C7', border: `1px solid ${dark ? '#3B475C' : '#FDE68A'}` }}
                      >
                        <button
                          onClick={() => setReplaceImages(p => !p)}
                          className="relative w-9 h-5 rounded-full flex-shrink-0 transition-colors"
                          style={{ background: replaceImages ? '#c7694f' : dark ? '#6B7280' : '#D1D5DB' }}
                        >
                          <div
                            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                            style={{ left: '2px', transform: replaceImages ? 'translateX(16px)' : 'none' }}
                          />
                        </button>
                        <div>
                          <p className="text-xs font-medium" style={{ color: dark ? '#F1F5F9' : '#92400E' }}>
                            {replaceImages ? 'Replace all existing images' : 'Add to existing images'}
                          </p>
                          <p className="text-[10px]" style={{ color: dark ? '#A6B7D2' : '#B45309' }}>
                            {replaceImages
                              ? 'Old images will be deleted. New upload becomes primary.'
                              : 'New images will be added alongside current ones.'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {msg && (
                    <p className={`text-xs ${msg.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>{msg}</p>
                  )}
                </div>

                <div className="px-6 py-4 flex justify-end gap-3 border-t" style={{ borderColor: dark ? '#3B475C' : '#E2E8F0' }}>
                  <button onClick={() => setModal(null)}
                    className="px-5 py-2 rounded-lg text-sm border"
                    style={{ borderColor: dark ? '#3B475C' : '#E2E8F0', color: dark ? '#A6B7D2' : '#798EAE' }}>
                    Cancel
                  </button>
                  <button onClick={save} disabled={saving}
                    className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: '#c7694f' }}>
                    {saving ? 'Saving…' : modal === 'new' ? 'Create Product' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
