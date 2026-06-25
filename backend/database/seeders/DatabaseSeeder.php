<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Coupon;
use App\Models\Review;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin User
        User::create([
            'name' => 'Sakshi',
            'email' => 'sakshi@strokesbysakshi.com',
            'password' => Hash::make('admin123'),
            'phone' => '+91-9876543210',
            'bio' => 'Founder & Lead Artist at Strokes by Sakshi. Transforming emotions into timeless art.',
            'is_admin' => true,
        ]);

        // Test Customer
        User::create([
            'name' => 'Priya Sharma',
            'email' => 'priya@example.com',
            'password' => Hash::make('password'),
            'phone' => '+91-9876543211',
            'bio' => 'Art enthusiast and collector.',
        ]);

        // Categories
        $categories = [
            ['name' => 'Portraits', 'slug' => 'portraits', 'description' => 'Handcrafted portrait art capturing the essence of your loved ones.', 'sort_order' => 1],
            ['name' => 'Abstract', 'slug' => 'abstract', 'description' => 'Expressive abstract pieces that speak to the soul.', 'sort_order' => 2],
            ['name' => 'Landscapes', 'slug' => 'landscapes', 'description' => 'Breathtaking landscapes painted with passion.', 'sort_order' => 3],
            ['name' => 'Custom Commissions', 'slug' => 'custom-commissions', 'description' => 'Bespoke artwork created just for you.', 'sort_order' => 4],
            ['name' => 'Prints', 'slug' => 'prints', 'description' => 'High-quality prints of original artworks.', 'sort_order' => 5],
            ['name' => 'Limited Editions', 'slug' => 'limited-editions', 'description' => 'Exclusive limited edition pieces.', 'sort_order' => 6],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }

        // Collections
        $collections = [
            ['name' => 'Eternal Bonds', 'slug' => 'eternal-bonds', 'description' => 'A collection celebrating the deepest human connections.', 'story' => 'Each piece in this collection tells a story of love, family, and the unbreakable bonds that define us.', 'is_featured' => true, 'sort_order' => 1],
            ['name' => 'Whispers of Nature', 'slug' => 'whispers-of-nature', 'description' => 'Nature-inspired artworks that bring the outdoors in.', 'story' => 'Inspired by the serene beauty of the natural world, this collection captures fleeting moments of tranquility.', 'is_featured' => true, 'sort_order' => 2],
            ['name' => 'Modern Classics', 'slug' => 'modern-classics', 'description' => 'Contemporary art with timeless appeal.', 'story' => 'Where tradition meets modernity — a fusion of classical techniques with contemporary vision.', 'is_featured' => true, 'sort_order' => 3],
            ['name' => 'The Signature Series', 'slug' => 'signature-series', 'description' => 'Sakshi\'s most personal and celebrated works.', 'story' => 'These pieces represent the pinnacle of my artistic journey — each one a piece of my heart.', 'is_featured' => true, 'sort_order' => 4],
        ];

        foreach ($collections as $col) {
            Collection::create($col);
        }

        // Placeholder images (picsum.photos — seeded so they're consistent)
        $placeholderImages = [
            'eternal-embrace'      => ['url' => 'https://picsum.photos/seed/10/600/900',  'thumb' => 'https://picsum.photos/seed/10/400/400'],
            'golden-hour-dreams'   => ['url' => 'https://picsum.photos/seed/20/900/600',  'thumb' => 'https://picsum.photos/seed/20/400/400'],
            'abstract-emotions-7'  => ['url' => 'https://picsum.photos/seed/30/750/750',  'thumb' => 'https://picsum.photos/seed/30/400/400'],
            'serenity-print'       => ['url' => 'https://picsum.photos/seed/40/800/600',  'thumb' => 'https://picsum.photos/seed/40/400/400'],
            'limited-edition-muse' => ['url' => 'https://picsum.photos/seed/50/600/840',  'thumb' => 'https://picsum.photos/seed/50/400/400'],
            'whispers-in-bloom'    => ['url' => 'https://picsum.photos/seed/60/600/825',  'thumb' => 'https://picsum.photos/seed/60/400/400'],
        ];

        // Sample Products
        $products = [
            [
                'name' => 'Eternal Embrace',
                'slug' => 'eternal-embrace',
                'description' => 'A deeply emotional portrait capturing the tender embrace of two souls. Painted with meticulous attention to every detail, this piece radiates warmth, love, and the timeless beauty of human connection. The soft interplay of light and shadow creates a dreamlike quality that draws the viewer into the intimate moment.',
                'short_description' => 'An emotional portrait capturing the beauty of human connection.',
                'story' => 'This painting was inspired by a quiet moment I witnessed between an elderly couple at a park. Their love, still so palpable after decades together, moved me to create this tribute to enduring love.',
                'materials' => 'Professional grade acrylics on stretched canvas. UV-protective varnish finish.',
                'care_instructions' => 'Keep away from direct sunlight. Dust gently with a soft, dry cloth.',
                'price' => 45000,
                'compare_price' => 55000,
                'product_type' => 'original',
                'medium' => 'Acrylic on Canvas',
                'surface' => 'Stretched Canvas',
                'orientation' => 'portrait',
                'width_cm' => 60,
                'height_cm' => 90,
                'is_featured' => true,
                'is_active' => true,
                'category_id' => 1,
                'collection_id' => 1,
                'tags' => json_encode(['portrait', 'love', 'emotional', 'acrylic', 'original']),
            ],
            [
                'name' => 'Golden Hour Dreams',
                'slug' => 'golden-hour-dreams',
                'description' => 'A stunning landscape bathed in the warm glow of golden hour. This piece captures the magical transition between day and night, with colors that shift from amber to deep purple across the horizon.',
                'short_description' => 'A breathtaking golden hour landscape painting.',
                'price' => 35000,
                'product_type' => 'original',
                'medium' => 'Oil on Canvas',
                'surface' => 'Stretched Canvas',
                'orientation' => 'landscape',
                'width_cm' => 90,
                'height_cm' => 60,
                'is_featured' => true,
                'is_active' => true,
                'category_id' => 3,
                'collection_id' => 2,
                'tags' => json_encode(['landscape', 'sunset', 'oil', 'nature', 'original']),
            ],
            [
                'name' => 'Abstract Emotions No. 7',
                'slug' => 'abstract-emotions-7',
                'description' => 'Part of the acclaimed Abstract Emotions series, this piece uses bold strokes and layered textures to convey the complexity of human feelings. Each viewing reveals new depths and interpretations.',
                'short_description' => 'An expressive abstract piece from the Emotions series.',
                'price' => 28000,
                'product_type' => 'original',
                'medium' => 'Mixed Media on Canvas',
                'surface' => 'Canvas Board',
                'orientation' => 'square',
                'width_cm' => 75,
                'height_cm' => 75,
                'is_featured' => true,
                'is_active' => true,
                'category_id' => 2,
                'collection_id' => 3,
                'tags' => json_encode(['abstract', 'mixed-media', 'expressive', 'original']),
            ],
            [
                'name' => 'Serenity Print',
                'slug' => 'serenity-print',
                'description' => 'A high-quality giclée print of the original Serenity painting. Printed on archival-quality paper with museum-grade inks, this piece brings the calm of the original into any space.',
                'short_description' => 'Museum-quality giclée print of the original Serenity.',
                'price' => 4500,
                'compare_price' => 6000,
                'product_type' => 'print',
                'medium' => 'Giclée Print',
                'surface' => 'Archival Paper',
                'orientation' => 'landscape',
                'width_cm' => 40,
                'height_cm' => 30,
                'is_featured' => true,
                'is_active' => true,
                'category_id' => 5,
                'collection_id' => 2,
                'tags' => json_encode(['print', 'serenity', 'landscape', 'giclee']),
            ],
            [
                'name' => 'Limited Edition: The Muse',
                'slug' => 'limited-edition-muse',
                'description' => 'An exclusive limited edition print, one of only 25 numbered copies. Each print is hand-signed, numbered, and comes with a certificate of authenticity. The Muse represents the divine inspiration behind all creative work.',
                'short_description' => 'Exclusive limited edition print. Only 25 available.',
                'price' => 12000,
                'product_type' => 'limited_edition',
                'medium' => 'Archival Pigment Print',
                'surface' => 'Fine Art Paper',
                'orientation' => 'portrait',
                'width_cm' => 50,
                'height_cm' => 70,
                'is_featured' => true,
                'is_active' => true,
                'category_id' => 6,
                'collection_id' => 4,
                'tags' => json_encode(['limited-edition', 'portrait', 'signed', 'collectible']),
            ],
            [
                'name' => 'Whispers in Bloom',
                'slug' => 'whispers-in-bloom',
                'description' => 'A delicate floral composition that captures the quiet beauty of nature\'s most intimate moments. Soft petals and gentle colors create a sense of peace and renewal.',
                'short_description' => 'A delicate floral masterpiece in soft tones.',
                'price' => 22000,
                'product_type' => 'original',
                'medium' => 'Watercolor on Paper',
                'surface' => 'Cold Press Paper',
                'orientation' => 'portrait',
                'width_cm' => 40,
                'height_cm' => 55,
                'is_featured' => true,
                'is_active' => true,
                'category_id' => 2,
                'collection_id' => 2,
                'tags' => json_encode(['floral', 'watercolor', 'delicate', 'original']),
            ],
        ];

        foreach ($products as $data) {
            $product = Product::create($data);
            // Create placeholder images
            $img = $placeholderImages[$product->slug] ?? [
                'url'   => "https://picsum.photos/seed/{$product->id}/600/800",
                'thumb' => "https://picsum.photos/seed/{$product->id}/400/400",
            ];
            ProductImage::create([
                'product_id'    => $product->id,
                'image_url'     => $img['url'],
                'thumbnail_url' => $img['thumb'],
                'alt_text'      => $product->name,
                'sort_order'    => 0,
                'is_primary'    => true,
            ]);
        }

        // Coupons
        Coupon::create([
            'code' => 'WELCOME10',
            'description' => '10% off for first-time customers',
            'type' => 'percentage',
            'value' => 10,
            'min_order_amount' => 2000,
            'max_discount' => 5000,
            'usage_limit' => 100,
            'starts_at' => now(),
            'expires_at' => now()->addYear(),
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'ARTLOVER',
            'description' => 'Flat ₹2000 off on orders above ₹15000',
            'type' => 'fixed',
            'value' => 2000,
            'min_order_amount' => 15000,
            'usage_limit' => 50,
            'starts_at' => now(),
            'expires_at' => now()->addMonths(6),
            'is_active' => true,
        ]);

        // Sample Reviews
        Review::create([
            'product_id' => 1,
            'user_id' => 2,
            'rating' => 5,
            'title' => 'Absolutely breathtaking',
            'body' => 'I commissioned a portrait of my parents for their anniversary, and the result was beyond anything I could have imagined. Sakshi captured not just their likeness, but their essence. Every detail, from the twinkle in my mother\'s eyes to the gentle smile on my father\'s face, is perfect.',
            'is_featured' => true,
            'is_approved' => true,
        ]);

        Review::create([
            'product_id' => 2,
            'user_id' => 2,
            'rating' => 5,
            'title' => 'Brings peace to my home',
            'body' => 'This painting hangs in my living room and every time I look at it, I feel a sense of calm wash over me. The colors are even more beautiful in person.',
            'is_featured' => true,
            'is_approved' => true,
        ]);
    }
}