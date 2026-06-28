<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomOrder;
use App\Models\CustomOrderFile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CustomOrderController extends Controller
{

    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()->customOrders()
            ->with('files')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_type' => 'required|string|in:sketch,portrait,acrylic_painting,digital_illustration,custom_canvas,other',
            'medium' => 'nullable|string|max:255',
            'size' => 'nullable|string|max:255',
            'orientation' => 'nullable|string|in:portrait,landscape,square',
            'is_framed' => 'boolean',
            'frame_color' => 'nullable|string|max:255',
            'color_style' => 'nullable|string|max:500',
            'background_style' => 'nullable|string|max:500',
            'urgency' => 'required|string|in:standard,expedited,rush',
            'customer_instructions' => 'nullable|string|max:5000',
            'is_gift' => 'boolean',
            'recipient_name' => 'nullable|required_if:is_gift,true|string|max:255',
            'recipient_message' => 'nullable|string|max:2000',
            'due_date' => 'nullable|date|after:today',
            'files' => 'nullable|array',
            'files.*' => 'file|mimes:jpg,jpeg,png,gif,webp,pdf,svg|max:10240',
        ]);

        $order = CustomOrder::create([
            'order_number' => CustomOrder::generateOrderNumber(),
            'user_id' => $request->user()?->id,
            'order_type' => $validated['order_type'],
            'medium' => $validated['medium'] ?? null,
            'size' => $validated['size'] ?? null,
            'orientation' => $validated['orientation'] ?? null,
            'is_framed' => $validated['is_framed'] ?? false,
            'frame_color' => $validated['frame_color'] ?? null,
            'color_style' => $validated['color_style'] ?? null,
            'background_style' => $validated['background_style'] ?? null,
            'urgency' => $validated['urgency'],
            'customer_instructions' => $validated['customer_instructions'] ?? null,
            'is_gift' => $validated['is_gift'] ?? false,
            'recipient_name' => $validated['recipient_name'] ?? null,
            'recipient_message' => $validated['recipient_message'] ?? null,
            'due_date' => $validated['due_date'] ?? null,
            'status' => 'pending',
        ]);

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path = $file->store('custom-orders/' . $order->id, 'public');
                
                $order->files()->create([
                    'file_path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'file_size' => $file->getSize(),
                    'disk' => 'public',
                ]);
            }
        }

        $order->load('files');

        return response()->json([
            'order' => $order,
            'message' => 'Custom order submitted successfully. We will review and get back to you within 24-48 hours.',
        ], 201);
    }

    public function show(CustomOrder $order): JsonResponse
    {
        $user = auth()->user();

        if ($order->user_id) {
            if (!$user || ($order->user_id !== $user->id && !$user->is_admin)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } elseif (!$user?->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $order->load('files');
        return response()->json($order);
    }

    public function uploadFiles(Request $request, CustomOrder $order): JsonResponse
    {
        if ($response = $this->authorizeCustomOrder($request, $order)) {
            return $response;
        }

        $validated = $request->validate([
            'files' => 'required|array',
            'files.*' => 'file|mimes:jpg,jpeg,png,gif,webp,pdf,svg|max:10240',
        ]);

        $uploaded = [];
        foreach ($request->file('files') as $file) {
            $path = $file->store('custom-orders/' . $order->id, 'public');
            $uploaded[] = $order->files()->create([
                'file_path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'disk' => 'public',
            ]);
        }

        return response()->json([
            'files' => $uploaded,
            'message' => 'Files uploaded successfully',
        ]);
    }

    public function removeFile(Request $request, CustomOrderFile $file): JsonResponse
    {
        if ($response = $this->authorizeCustomOrder($request, $file->customOrder)) {
            return $response;
        }

        Storage::disk($file->disk)->delete($file->file_path);
        $file->delete();
        return response()->json(['message' => 'File removed']);
    }

    public function track(string $orderNumber): JsonResponse
    {
        $order = CustomOrder::where('order_number', $orderNumber)
            ->firstOrFail();

        return response()->json([
            'order_number' => $order->order_number,
            'status' => $order->status,
            'order_type' => $order->order_type,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'final_price' => $order->final_price,
            'estimated_price' => $order->estimated_price,
        ]);
    }

    public function calculateEstimate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_type' => 'required|string|in:sketch,portrait,acrylic_painting,digital_illustration,custom_canvas,other',
            'size' => 'required|string|in:small,medium,large,extra_large',
            'urgency' => 'required|string|in:standard,expedited,rush',
            'is_framed' => 'boolean',
        ]);

        $basePrices = [
            'sketch' => 2500,
            'portrait' => 8000,
            'acrylic_painting' => 15000,
            'digital_illustration' => 5000,
            'custom_canvas' => 12000,
            'other' => 5000,
        ];

        $sizeMultipliers = [
            'small' => 1,
            'medium' => 1.5,
            'large' => 2.5,
            'extra_large' => 4,
        ];

        $urgencyMultipliers = [
            'standard' => 1,
            'expedited' => 1.3,
            'rush' => 1.75,
        ];

        $basePrice = $basePrices[$validated['order_type']] ?? 5000;
        $sizeMultiplier = $sizeMultipliers[$validated['size']] ?? 1;
        $urgencyMultiplier = $urgencyMultipliers[$validated['urgency']];
        $framingCost = $validated['is_framed'] ? 2000 : 0;

        $estimate = $basePrice * $sizeMultiplier * $urgencyMultiplier + $framingCost;

        return response()->json([
            'estimate' => round($estimate, 2),
            'currency' => 'INR',
            'breakdown' => [
                'base_price' => $basePrice,
                'size_multiplier' => $sizeMultiplier,
                'urgency_multiplier' => $urgencyMultiplier,
                'framing_cost' => $framingCost,
            ],
        ]);
    }

    private function authorizeCustomOrder(Request $request, CustomOrder $order): ?JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($order->user_id && $order->user_id !== $user->id && !$user->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$order->user_id && !$user->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return null;
    }
}
