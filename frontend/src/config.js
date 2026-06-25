export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000/storage';

export const SITE_CONFIG = {
  name: 'Strokes by Sakshi',
  tagline: 'Where Emotions Find Their Canvas',
  description: 'Handcrafted art and custom portraits that tell your story. Every brushstroke carries emotion, every piece is a piece of the heart.',
  email: 'hello@strokesbysakshi.com',
  phone: '+91 98765 43210',
  address: 'Mumbai, Maharashtra, India',
  social: {
    instagram: 'https://instagram.com/strokesbysakshi',
    facebook: 'https://facebook.com/strokesbysakshi',
    pinterest: 'https://pinterest.com/strokesbysakshi',
    youtube: 'https://youtube.com/@strokesbysakshi',
    whatsapp: 'https://wa.me/919876543210',
  },
};

export const ARTWORK_TYPES = [
  { value: 'sketch', label: 'Pencil Sketch', basePrice: 2500 },
  { value: 'portrait', label: 'Portrait Painting', basePrice: 8000 },
  { value: 'acrylic_painting', label: 'Acrylic Painting', basePrice: 15000 },
  { value: 'digital_illustration', label: 'Digital Illustration', basePrice: 5000 },
  { value: 'custom_canvas', label: 'Custom Canvas Art', basePrice: 12000 },
  { value: 'other', label: 'Other Medium', basePrice: 5000 },
];

export const SIZES = [
  { value: 'small', label: 'Small (12" x 16")', multiplier: 1 },
  { value: 'medium', label: 'Medium (18" x 24")', multiplier: 1.5 },
  { value: 'large', label: 'Large (24" x 36")', multiplier: 2.5 },
  { value: 'extra_large', label: 'Extra Large (36" x 48")', multiplier: 4 },
];

export const URGENCY_OPTIONS = [
  { value: 'standard', label: 'Standard (3-4 weeks)', multiplier: 1 },
  { value: 'expedited', label: 'Expedited (2 weeks)', multiplier: 1.3 },
  { value: 'rush', label: 'Rush (1 week)', multiplier: 1.75 },
];

export const ORIENTATIONS = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'square', label: 'Square' },
];

export const FRAME_COLORS = [
  { value: 'black', label: 'Black', hex: '#1a1a1a' },
  { value: 'white', label: 'White', hex: '#f5f5f5' },
  { value: 'walnut', label: 'Walnut', hex: '#5c3a1e' },
  { value: 'gold', label: 'Gold', hex: '#c9a94e' },
  { value: 'silver', label: 'Silver', hex: '#b0b0b0' },
];

export const CUSTOM_ORDER_STATUSES = [
  { value: 'draft', label: 'Draft', color: '#6B6B6B' },
  { value: 'pending', label: 'Pending Review', color: '#D4A853' },
  { value: 'in_review', label: 'In Review', color: '#9CAF88' },
  { value: 'quote_sent', label: 'Quote Sent', color: '#C9A94E' },
  { value: 'quote_approved', label: 'Quote Approved', color: '#7CB583' },
  { value: 'in_progress', label: 'In Progress', color: '#C7694F' },
  { value: 'shipped', label: 'Shipped', color: '#9CAF88' },
  { value: 'delivered', label: 'Delivered', color: '#7CB583' },
  { value: 'cancelled', label: 'Cancelled', color: '#C45A5A' },
];

export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: '#D4A853' },
  { value: 'confirmed', label: 'Confirmed', color: '#9CAF88' },
  { value: 'processing', label: 'Processing', color: '#C7694F' },
  { value: 'shipped', label: 'Shipped', color: '#9CAF88' },
  { value: 'delivered', label: 'Delivered', color: '#7CB583' },
  { value: 'cancelled', label: 'Cancelled', color: '#C45A5A' },
  { value: 'refunded', label: 'Refunded', color: '#6B6B6B' },
];