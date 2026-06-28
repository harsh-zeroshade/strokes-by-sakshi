<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\Coupon;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cart = $this->getCart($request);
        if (!$cart) {
            return response()->json(['items' => [], 'subtotal' => 0, 'total' => 0, 'discount' => 0, 'tax' => 0, 'shipping' => 0]);
        }
        $cart->load('items.product.primaryImage', 'items.variant');
        $cart->recalculate();
        return response()->json($cart);
    }

    public function add(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'product_variant_id' => 'nullable|exists:product_variants,id',
            'quantity' => 'required|integer|min:1|max:10',
            'options' => 'nullable|array',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $cart = $this->getOrCreateCart($request);

        $existingItem = $cart->items()->where('product_id', $validated['product_id'])
            ->where('product_variant_id', $validated['product_variant_id'])
            ->first();

        if ($existingItem) {
            $existingItem->update([
                'quantity' => $existingItem->quantity + $validated['quantity'],
                'subtotal' => ($existingItem->quantity + $validated['quantity']) * $existingItem->unit_price,
            ]);
        } else {
            $price = $product->price;
            if ($validated['product_variant_id']) {
                $variant = $product->variants()->find($validated['product_variant_id']);
                $price += $variant?->price_modifier ?? 0;
            }

            $cart->items()->create([
                'product_id' => $validated['product_id'],
                'product_variant_id' => $validated['product_variant_id'],
                'quantity' => $validated['quantity'],
                'unit_price' => $price,
                'subtotal' => $price * $validated['quantity'],
                'options' => $validated['options'],
            ]);
        }

        $cart->recalculate();
        $cart->load('items.product.primaryImage', 'items.variant');

        return response()->json($cart);
    }

    public function update(Request $request, CartItem $item): JsonResponse
    {
        if ($response = $this->authorizeCartItem($request, $item)) {
            return $response;
        }

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:10',
        ]);

        $item->update([
            'quantity' => $validated['quantity'],
            'subtotal' => $item->unit_price * $validated['quantity'],
        ]);

        $item->cart->recalculate();
        $item->cart->load('items.product.primaryImage', 'items.variant');

        return response()->json($item->cart);
    }

    public function remove(Request $request, CartItem $item): JsonResponse
    {
        if ($response = $this->authorizeCartItem($request, $item)) {
            return $response;
        }

        $cart = $item->cart;
        $item->delete();
        $cart->recalculate();
        $cart->load('items.product.primaryImage', 'items.variant');
        return response()->json($cart);
    }

    public function applyCoupon(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|exists:coupons,code',
        ]);

        $cart = $this->getCart($request);
        if (!$cart) {
            return response()->json(['message' => 'Cart not found'], 404);
        }

        $coupon = Coupon::where('code', $validated['code'])->first();
        
        if (!$coupon->isValid()) {
            return response()->json(['message' => 'Coupon is expired or invalid'], 400);
        }

        $discount = $coupon->applyDiscount($cart->subtotal);
        
        $cart->update([
            'coupon_code' => $coupon->code,
            'discount' => $discount,
        ]);

        $cart->recalculate();
        return response()->json($cart);
    }

    public function removeCoupon(Request $request): JsonResponse
    {
        $cart = $this->getCart($request);
        if ($cart) {
            $cart->update(['coupon_code' => null, 'discount' => 0]);
            $cart->recalculate();
        }
        return response()->json($cart);
    }

    public function moveToWishlist(Request $request, CartItem $item): JsonResponse
    {
        if ($response = $this->authorizeCartItem($request, $item)) {
            return $response;
        }

        if ($request->user()) {
            $request->user()->wishlists()->firstOrCreate(['product_id' => $item->product_id]);
        }
        $item->delete();
        return response()->json(['message' => 'Moved to wishlist']);
    }

    public function saveForLater(Request $request, CartItem $item): JsonResponse
    {
        if ($response = $this->authorizeCartItem($request, $item)) {
            return $response;
        }

        $item->update(['is_saved_for_later' => true]);
        return response()->json(['message' => 'Saved for later']);
    }

    private function getAuthenticatedUser(Request $request): ?User
    {
        $header = $request->header('Authorization', '');
        if (!str_starts_with($header, 'Bearer ')) {
            return null;
        }
        $tokenString = substr($header, 7);
        $token = PersonalAccessToken::findToken($tokenString);
        return $token?->tokenable instanceof User ? $token->tokenable : null;
    }

    private function getCart(Request $request): ?Cart
    {
        // Manually resolve the authenticated user since cart routes are public (no auth:sanctum middleware)
        $user = $this->getAuthenticatedUser($request);
        if ($user) {
            return Cart::where('user_id', $user->id)->first();
        }
        $sessionId = $request->header('X-Session-ID');
        return $sessionId ? Cart::where('session_id', $sessionId)->first() : null;
    }

    private function getOrCreateCart(Request $request): Cart
    {
        // Manually resolve the authenticated user since cart routes are public (no auth:sanctum middleware)
        $user = $this->getAuthenticatedUser($request);
        if ($user) {
            return Cart::firstOrCreate(['user_id' => $user->id]);
        }
        $sessionId = $request->header('X-Session-ID') ?? ('sess_' . uniqid('', true));
        return Cart::firstOrCreate(['session_id' => $sessionId]);
    }

    private function authorizeCartItem(Request $request, CartItem $item): ?JsonResponse
    {
        $cart = $this->getCart($request);

        if (!$cart || $item->cart_id !== $cart->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return null;
    }
}