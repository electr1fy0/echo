package email

import (
	"fmt"
	"os"

	"github.com/resend/resend-go/v3"
)

func SendVerificationEmail(to, username string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		fmt.Println("RESEND_API_KEY is not set, skipping email sending")
		return nil
	}

	client := resend.NewClient(apiKey)

	htmlContent := fmt.Sprintf(`
		<h1>Welcome to Echo, %s!</h1>
		<p>Thanks for signing up. Please verify your email address to get started.</p>
		<p>Since this is a demo, your email is practically verified by just receiving this!</p>
		<p>Cheers,<br>The Echo Team</p>
	`, username)

	params := &resend.SendEmailRequest{
		From:    "Echo <onboarding@resend.dev>",
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
