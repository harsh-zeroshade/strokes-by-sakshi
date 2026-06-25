<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('order_type', ['sketch', 'portrait', 'acrylic_painting', 'digital_illustration', 'custom_canvas', 'other'])->default('portrait');
            $table->string('medium')->nullable();
            $table->string('size')->nullable();
            $table->string('orientation')->nullable();
            $table->boolean('is_framed')->default(false);
            $table->string('frame_color')->nullable();
            $table->string('color_style')->nullable();
            $table->string('background_style')->nullable();
            $table->enum('urgency', ['standard', 'expedited', 'rush'])->default('standard');
            $table->decimal('estimated_price', 12, 2)->nullable();
            $table->decimal('final_price', 12, 2)->nullable();
            $table->text('customer_instructions')->nullable();
            $table->text('artist_notes')->nullable();
            $table->boolean('is_gift')->default(false);
            $table->string('recipient_name')->nullable();
            $table->text('recipient_message')->nullable();
            $table->enum('status', ['draft', 'pending', 'in_review', 'quote_sent', 'quote_approved', 'in_progress', 'shipped', 'delivered', 'cancelled'])->default('draft');
            $table->date('due_date')->nullable();
            $table->timestamp('quote_sent_at')->nullable();
            $table->timestamp('quote_approved_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('custom_order_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('custom_order_id')->constrained()->onDelete('cascade');
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime_type');
            $table->integer('file_size');
            $table->string('disk')->default('public');
            $table->timestamps();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('rating')->unsigned()->default(5);
            $table->text('title')->nullable();
            $table->text('body')->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_approved')->default(false);
            $table->timestamps();
        });

        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('product_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            $table->unique(['user_id', 'product_id']);
        });

        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->enum('type', ['percentage', 'fixed'])->default('percentage');
            $table->decimal('value', 12, 2);
            $table->decimal('min_order_amount', 12, 2)->nullable();
            $table->decimal('max_discount', 12, 2)->nullable();
            $table->integer('usage_limit')->nullable();
            $table->integer('used_count')->default(0);
            $table->date('starts_at')->nullable();
            $table->date('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('coupons');
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('custom_order_files');
        Schema::dropIfExists('custom_orders');
    }
};