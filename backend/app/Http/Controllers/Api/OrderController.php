<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Cart;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{

    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()
            ->with('items')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($orders);
    }

    public function show(Order $order): JsonResponse
    {
        if ($order->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $order->load('items.product.primaryImage', 'payments');
        return response()->json($order);
    }

    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shipping_address' => 'required|array',
            'shipping_address.full_name' => 'required|string',
            'shipping_address.phone' => 'required|string',
            'shipping_address.street_address' => 'required|string',
            'shipping_address.city' => 'required|string',
            'shipping_address.state' => 'required|string',
            'shipping_address.postal_code' => 'required|string',
            'shipping_address.country' => 'required|string',
            'billing_address' => 'sometimes|array',
            'notes' => 'nullable|string',
            'payment_method' => 'required|string|in:razorpay,stripe,cod',
        ]);

        $cart = Cart::where('user_id', $request->user()->id)->first();
        if (!$cart || $cart->items->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        $cart->load('items.product', 'items.variant');

        $order = Order::create([
            'order_number' => Order::generateOrderNumber(),
            'user_id' => $request->user()->id,
            'status' => 'pending',
            'subtotal' => $cart->subtotal,
            'discount' => $cart->discount,
            'tax' => $cart->tax,
            'shipping' => $cart->shipping,
            'total' => $cart->total,
            'coupon_code' => $cart->coupon_code,
            'notes' => $validated['notes'] ?? null,
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'pending',
            'shipping_address' => json_encode($validated['shipping_address']),
            'billing_address' => json_encode($validated['billing_address'] ?? $validated['shipping_address']),
        ]);

        foreach ($cart->items as $item) {
            $order->items()->create([
                'product_id' => $item->product_id,
                'product_variant_id' => $item->product_variant_id,
                'product_name' => $item->product->name,
                'variant_name' => $item->variant?->name,
                'product_image' => $item->product->thumbnail,
                'sku' => $item->product->sku,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'subtotal' => $item->subtotal,
                'options' => $item->options,
            ]);
        }

        $cart->items()->delete();
        $cart->delete();

        return response()->json([
            'order' => $order->load('items'),
            'message' => 'Order placed successfully',
        ], 201);
    }

    public function track(Request $request, string $orderNumber): JsonResponse
    {
        $order = Order::where('order_number', $orderNumber)
            ->with('items')
            ->firstOrFail();

        return response()->json($order);
    }
}