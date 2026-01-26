package email

import (
	"fmt"
	"os"

	"github.com/resend/resend-go/v3"
)

func getTemplate(title, username, content, actionText, actionUrl string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #09090b; margin: 0; padding: 0; background-color: #ffffff; }
		.container { max-width: 480px; margin: 60px auto; background: #ffffff; border: 1px dashed #e4e4e7; border-radius: 12px; padding: 48px; }
		.header { margin-bottom: 32px; }
		.logo { color: #09090b; font-size: 20px; font-weight: 300; text-decoration: none; letter-spacing: 0.5px; }
		.h1 { font-size: 18px; font-weight: 400; margin-top: 0; margin-bottom: 24px; color: #09090b; }
		.text { font-size: 15px; font-weight: 300; margin-bottom: 24px; color: #52525b; }
		.btn-container { margin: 32px 0; }
		.btn { display: inline-block; border: 1px solid #09090b; color: #09090b; padding: 10px 24px; border-radius: 9999px; font-weight: 400; text-decoration: none; font-size: 14px; transition: all 0.2s; }
		.btn:hover { background-color: #09090b; color: #ffffff; }
		.footer { margin-top: 48px; padding-top: 24px; border-top: 1px dashed #e4e4e7; font-size: 12px; font-weight: 300; color: #a1a1aa; }
		.link { color: #09090b; text-decoration: underline; text-underline-offset: 4px; word-break: break-all; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<span class="logo">Echo</span>
		</div>
		<div class="content">
			<h1 class="h1">%s</h1>
			<p class="text">Hi %s,</p>
			<p class="text">%s</p>
			<div class="btn-container">
				<a href="%s" class="btn">%s</a>
			</div>
			<p style="font-size: 13px; font-weight: 300; color: #71717a; margin-top: 32px; margin-bottom: 8px;">If the button above doesn't work, you can copy and paste this link:</p>
			<p style="font-size: 13px; margin: 0;"><a href="%s" class="link">%s</a></p>
		</div>
		<div class="footer">
			&copy; Echo. All rights reserved.
		</div>
	</div>
</body>
</html>`, title, username, content, actionUrl, actionText, actionUrl, actionUrl)
}

func SendVerificationEmail(to, username, token string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		fmt.Println("RESEND_API_KEY is not set, skipping email sending")
		return nil
	}

	client := resend.NewClient(apiKey)
	domain := os.Getenv("ECHO_DOMAIN")
	if domain == "" {
		domain = "localhost:5173"
	}
	verifyLink := fmt.Sprintf("https://%s/verify-email?token=%s", domain, token)

	htmlContent := getTemplate(
		"Verify your email",
		username,
		"Thanks for joining echo. To get started, please verify your email address.",
		"Verify Email",
		verifyLink,
	)

	from := fmt.Sprintf("Echo <hello@%s>", domain)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{to},
		Subject: "Verify your email",
		Html:    htmlContent,
	}
	sent, err := client.Emails.Send(params)
	if err != nil {
		return err
	}
	fmt.Printf("Email sent successfully: %s\n", sent.Id)
	return nil
}

func SendPasswordResetEmail(to, username, token string) error {
	domain := os.Getenv("ECHO_DOMAIN")
	if domain == "" {
		domain = "localhost:5173"
	}
	resetLink := fmt.Sprintf("https://%s/reset-password?token=%s", domain, token)

	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		fmt.Println("RESEND_API_KEY is not set, skipping email sending")
		return nil
	}
	client := resend.NewClient(apiKey)

	htmlContent := getTemplate(
		"Reset your password",
		username,
		"We received a request to reset your password. If you didn't make this request, you can safely ignore this email.",
		"Reset Password",
		resetLink,
	)

	from := fmt.Sprintf("Echo <hello@%s>", domain)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{to},
		Subject: "Reset Your Password",
		Html:    htmlContent,
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		return err
	}

	fmt.Printf("Password reset email sent successfully: %s\n", sent.Id)
	return nil
}
