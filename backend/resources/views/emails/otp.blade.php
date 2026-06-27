<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
    <style>
        body { margin: 0; padding: 0; background: #f5f3f0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 24px rgba(0,0,0,0.06); }
        .header { padding: 32px 32px 8px; text-align: center; }
        .header h1 { font-family: 'Playfair Display', Georgia, serif; font-size: 24px; font-weight: 400; color: #1a1a1a; margin: 0; }
        .header span { display: block; font-size: 11px; letter-spacing: 2px; color: #999; font-weight: 300; text-transform: uppercase; margin-top: 2px; }
        .body { padding: 8px 32px 32px; text-align: center; }
        .body p { font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 24px; }
        .code { display: inline-block; font-size: 36px; font-weight: 600; letter-spacing: 8px; color: #C7694F; background: #faf8f6; padding: 16px 32px; border-radius: 12px; font-family: 'Inter', monospace; }
        .footer { padding: 24px 32px; background: #faf8f6; text-align: center; }
        .footer p { font-size: 11px; color: #aaa; margin: 0; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Strokes</h1>
            <span>by Sakshi</span>
        </div>
        <div class="body">
            <p>
                @if ($type === 'register')
                    Thank you for joining! Use the code below to verify your email address.
                @else
                    Use the code below to complete your sign in.
                @endif
            </p>
            <div class="code">{{ $code }}</div>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
                This code expires in 10 minutes. If you didn't request this, you can ignore this email.
            </p>
        </div>
        <div class="footer">
            <p>Strokes by Sakshi &mdash; Where Emotions Find Their Canvas</p>
        </div>
    </div>
</body>
</html>