package email

import (
	"fmt"
	"os"

	"github.com/resend/resend-go/v3"
)

func SendVerificationEmail(to, username, token string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		fmt.Println("RESEND_API_KEY is not set, skipping email sending")
		return nil
	}

	client := resend.NewClient(apiKey)
	domain := os.Getenv("ECHO_DOMAIN")
	verifyLink := fmt.Sprintf("https://%s/verify-email?token=%s", domain, token)
	htmlContent := fmt.Sprintf(`
		<h1>Welcome to Echo, %s!</h1>
		<p>Thanks for signing up. Please verify your email address by clicking the link below:</p>
		<p>%s</p>
		<p>Cheers,<br>The Echo Team</p>
	`, username, verifyLink)
	from := fmt.Sprintf("Echo <hello@%s>", domain)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      []string{to},
		Subject: "Welcome to Echo! Please verify your email",
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

	htmlContent := fmt.Sprintf(`
		<h1>Reset Your Password</h1>
		<p>Hi %s,</p>
		<p>You requested to reset your password. Click the link below to verify your email and set a new password:</p>
		<p><a href="%s">Reset Password</a></p>
		<p>If you didn't request this, you can safely ignore this email.</p>
		<p>Cheers,<br>The Echo Team</p>
	`, username, resetLink)

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
