<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Collector Account Created</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
        }
        .header h1 {
            color: #10b981;
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin-bottom: 30px;
        }
        .info-box {
            background-color: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .credentials {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .credential-item {
            margin: 10px 0;
        }
        .credential-label {
            font-weight: bold;
            color: #374151;
            display: inline-block;
            width: 120px;
        }
        .credential-value {
            color: #111827;
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 5px 10px;
            border-radius: 4px;
            display: inline-block;
        }
        .password-warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            color: #92400e;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #10b981;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌱 GreenSync</h1>
        </div>

        <div class="content">
            <p>Hello <strong>{{ $collector->name }}</strong>,</p>

            <p>Your collector account has been successfully created by the administrator. You can now access the GreenSync collector portal using the credentials below:</p>

            <div class="credentials">
                <div class="credential-item">
                    <span class="credential-label">Email:</span>
                    <span class="credential-value">{{ $collector->email }}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Password:</span>
                    <span class="credential-value">{{ $password }}</span>
                </div>
                @if($collector->employee_id)
                <div class="credential-item">
                    <span class="credential-label">Employee ID:</span>
                    <span class="credential-value">{{ $collector->employee_id }}</span>
                </div>
                @endif
            </div>

            <div class="password-warning">
                <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
            </div>

            <div class="info-box">
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>Log in to your collector account using the credentials above</li>
                    <li>Change your password to something secure and memorable</li>
                    <li>Complete your profile if any additional information is required</li>
                    <li>Start managing your collection routes and schedules</li>
                </ul>
            </div>

            <p>If you have any questions or need assistance, please contact the administrator.</p>

            <p>Welcome to the GreenSync team!</p>

            <p>Best regards,<br>
            <strong>The GreenSync Team</strong></p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{ date('Y') }} GreenSync. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

