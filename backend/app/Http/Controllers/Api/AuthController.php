<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use App\Services\CloudinaryService;

class AuthController extends Controller
{
    // ── Existing: Register ──────────────────────────────────────────────

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|max:128|confirmed',
            'phone'    => 'nullable|string|max:20',
        ]);

        // Normalise
        $validated['email'] = strtolower(trim($validated['email']));
        $validated['name']  = trim($validated['name']);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone'    => $validated['phone'] ?? null,
        ]);

        $this->mergeGuestCart($user, $request);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ], 201);
    }

    // ── Existing: Login ─────────────────────────────────────────────────

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|string|email|max:255',
            'password' => 'required|string|max:256',
        ]);

        $email    = strtolower(trim($request->input('email')));
        $password = $request->input('password');

        // Find user case-insensitively so existing mixed-case accounts still work
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        $this->mergeGuestCart($user, $request);

        // Revoke old tokens and issue a fresh one
        $user->tokens()->delete();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    // ── OTP: Send verification code ─────────────────────────────────────

    public function sendOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email|max:255',
            'type'  => 'required|string|in:register,login',
            'name'     => 'sometimes|string|max:255',
            'password' => 'sometimes|string|min:8',
            'password_confirmation' => 'sometimes|string|min:8',
        ]);

        $email = $validated['email'];
        $type  = $validated['type'];

        // For login, check user exists
        if ($type === 'login') {
            $user = User::where('email', $email)->first();
            if (!$user) {
                return response()->json([
                    'message' => 'No account found with this email address.',
                ], 404);
            }
        }

        // For register, check email not already taken
        if ($type === 'register') {
            if (User::where('email', $email)->exists()) {
                return response()->json([
                    'message' => 'An account with this email already exists.',
                ], 409);
            }
        }

        // Invalidate any previous unused OTPs for this email+type
        OtpCode::where('email', $email)
            ->where('type', $type)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);

        // Generate 6-digit code
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpCode::create([
            'email'      => $email,
            'code'       => $code,
            'type'       => $type,
            'name'       => $validated['name'] ?? null,
            'password'   => isset($validated['password']) ? Hash::make($validated['password']) : null,
            'expires_at' => now()->addMinutes(10),
        ]);

        // Send OTP via email
        try {
            Mail::send('emails.otp', ['code' => $code, 'type' => $type], function ($message) use ($email) {
                $message->to($email)
                    ->subject('Your Strokes by Sakshi Verification Code');
            });
        } catch (\Exception $e) {
            // If mail fails, still return the OTP in dev/error response
            // In production, log the error but don't expose to user
        }

        return response()->json([
            'message' => 'Verification code sent to your email.',
            // Remove in production — only for dev convenience
            'debug_code' => app()->environment('local', 'testing') ? $code : null,
        ]);
    }

    // ── OTP: Verify code and complete auth ──────────────────────────────

    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|string|email',
            'code'  => 'required|string|size:6',
            'type'  => 'required|string|in:register,login',
        ]);

        $otp = OtpCode::valid($validated['email'], $validated['code'], $validated['type'])->first();

        if (!$otp) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
            ], 422);
        }

        // Mark as used
        $otp->update(['used_at' => now()]);

        if ($validated['type'] === 'register') {
            // Create the user with data stored in OTP
            $user = User::create([
                'name'     => $otp->name ?? explode('@', $otp->email)[0],
                'email'    => $otp->email,
                'password' => $otp->password ?? Hash::make(Str::random(16)),
            ]);

            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'message' => 'Account created successfully.',
                'user'    => $user,
                'token'   => $token,
            ], 201);
        }

        // Login type
        $user = User::where('email', $validated['email'])->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        Auth::login($user);

        // Merge guest cart
        $this->mergeGuestCart($user, $request);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully.',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    // ── Google Auth: Redirect ───────────────────────────────────────────

    public function googleRedirect(): JsonResponse
    {
        $url = Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    // ── Google Auth: Callback ───────────────────────────────────────────

    public function googleCallback(Request $request): JsonResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Google authentication failed.'], 401);
        }

        // Find or create user
        $user = User::where('email', $googleUser->getEmail())->first();

        if (!$user) {
            $user = User::create([
                'name'              => $googleUser->getName(),
                'email'             => $googleUser->getEmail(),
                'password'          => Hash::make(Str::random(24)),
                'avatar_url'        => $googleUser->getAvatar(),
                'email_verified_at' => now(),
            ]);
        } else {
            // Update avatar if they already existed
            if ($googleUser->getAvatar()) {
                $user->update(['avatar_url' => $googleUser->getAvatar()]);
            }
            // Ensure verified
            if (!$user->email_verified_at) {
                $user->update(['email_verified_at' => now()]);
            }
        }

        $this->mergeGuestCart($user, $request);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    // ── Existing: Logout ────────────────────────────────────────────────

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    // ── Existing: User ──────────────────────────────────────────────────

    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('wishlistProducts'));
    }

    // ── Existing: Update Profile ────────────────────────────────────────

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'       => 'sometimes|string|max:255|regex:/^[\pL\s\-\'\.]+$/u',
            'phone'      => 'sometimes|nullable|string|max:20|regex:/^[\+\d\s\-\(\)]+$/',
            'bio'        => 'sometimes|nullable|string|max:1000',
            // Only allow Cloudinary or Google avatar URLs — reject arbitrary external images
            'avatar_url' => [
                'sometimes', 'nullable', 'url', 'max:500',
                'regex:#^https://(res\.cloudinary\.com|lh3\.googleusercontent\.com)/#i',
            ],
        ], [
            'name.regex'       => 'Name may only contain letters, spaces, hyphens, and apostrophes.',
            'avatar_url.regex' => 'Avatar URL must be a Cloudinary or Google image URL.',
        ]);

        // Sanitise bio — strip HTML tags
        if (isset($validated['bio'])) {
            $validated['bio'] = strip_tags($validated['bio']);
        }
        if (isset($validated['name'])) {
            $validated['name'] = trim($validated['name']);
        }

        $user->update($validated);

        return response()->json($user);
    }

    // ── Upload Avatar via Cloudinary ────────────────────────────────────

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,webp,jpg|max:3072|dimensions:min_width=50,min_height=50,max_width=4000,max_height=4000',
        ]);

        $user = $request->user();

        // Rate-limit: max 5 avatar uploads per hour per user
        $cacheKey = 'avatar_upload:' . $user->id;
        $uploads  = \Illuminate\Support\Facades\Cache::get($cacheKey, 0);
        if ($uploads >= 5) {
            return response()->json(['message' => 'Too many uploads. Please try again later.'], 429);
        }
        \Illuminate\Support\Facades\Cache::put($cacheKey, $uploads + 1, now()->addHour());

        // Verify file is actually an image by checking magic bytes
        $file      = $request->file('avatar');
        $mimeType  = $file->getMimeType();
        if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp'])) {
            return response()->json(['message' => 'Invalid image format.'], 422);
        }

        // Delete old Cloudinary avatar if it exists
        if ($user->avatar_url && str_contains($user->avatar_url, 'cloudinary.com')) {
            try {
                $cloudinary = new CloudinaryService();
                $publicId   = $cloudinary->getPublicId($user->avatar_url);
                if ($publicId) {
                    $cloudinary->destroy($publicId);
                }
            } catch (\Exception $e) {
                // Best-effort — don't block upload if delete fails
            }
        }

        // Upload new avatar to Cloudinary
        $cloudinary = new CloudinaryService();
        $avatarUrl  = $cloudinary->upload(
            $file,
            'strokes-by-sakshi/avatars/' . $user->id
        );

        $user->update(['avatar_url' => $avatarUrl]);

        return response()->json(['avatar_url' => $avatarUrl, 'user' => $user]);
    }

    // ── Private: Merge Guest Cart ───────────────────────────────────────

    private function mergeGuestCart(User $user, Request $request): void
    {
        $sessionId = $request->header('X-Session-ID');
        if (!$sessionId) {
            return;
        }

        $guestCart = Cart::where('session_id', $sessionId)->first();
        if (!$guestCart || $guestCart->items->isEmpty()) {
            return;
        }

        $userCart = Cart::firstOrCreate(['user_id' => $user->id]);

        foreach ($guestCart->items as $guestItem) {
            $existingItem = $userCart->items()
                ->where('product_id', $guestItem->product_id)
                ->where('product_variant_id', $guestItem->product_variant_id)
                ->first();

            if ($existingItem) {
                $existingItem->update([
                    'quantity' => $existingItem->quantity + $guestItem->quantity,
                    'subtotal' => ($existingItem->quantity + $guestItem->quantity) * $existingItem->unit_price,
                ]);
            } else {
                $userCart->items()->create([
                    'product_id'         => $guestItem->product_id,
                    'product_variant_id' => $guestItem->product_variant_id,
                    'quantity'           => $guestItem->quantity,
                    'unit_price'         => $guestItem->unit_price,
                    'subtotal'           => $guestItem->subtotal,
                    'options'            => $guestItem->options,
                ]);
            }
        }

        $userCart->recalculate();

        $guestCart->items()->delete();
        $guestCart->delete();
    }
}