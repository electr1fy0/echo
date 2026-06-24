type EmailEnv = {
  ECHO_DOMAIN?: string;
  RESEND_API_KEY?: string;
};

const toAppBaseUrl = (domain?: string) => {
  if (!domain) {
    return "http://localhost:5173";
  }

  if (domain.startsWith("http://") || domain.startsWith("https://")) {
    return domain;
  }

  return `https://${domain}`;
};

const toSenderDomain = (domain?: string) => {
  const baseUrl = toAppBaseUrl(domain);
  return new URL(baseUrl).hostname;
};

const getTemplate = (
  title: string,
  username: string,
  content: string,
  actionText: string,
  actionUrl: string,
  extraContent?: string,
) => `<!DOCTYPE html>
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
    .btn { display: inline-block; border: 1px solid #09090b; color: #09090b; padding: 10px 24px; border-radius: 9999px; font-weight: 400; text-decoration: none; font-size: 14px; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px dashed #e4e4e7; font-size: 12px; font-weight: 300; color: #a1a1aa; }
    .link { color: #09090b; text-decoration: underline; text-underline-offset: 4px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo">TurnsOut</span>
    </div>
    <div class="content">
      <h1 class="h1">${title}</h1>
      <p class="text">Hi ${username},</p>
      <p class="text">${content}</p>
      ${extraContent || ""}
      <div class="btn-container">
        <a href="${actionUrl}" class="btn">${actionText}</a>
      </div>
      <p style="font-size: 13px; font-weight: 300; color: #71717a; margin-top: 32px; margin-bottom: 8px;">If the button above doesn't work, you can copy and paste this link:</p>
      <p style="font-size: 13px; margin: 0;"><a href="${actionUrl}" class="link">${actionUrl}</a></p>
    </div>
    <div class="footer">
      &copy; TurnsOut. All rights reserved.
    </div>
  </div>
</body>
</html>`;

const sendEmail = async (
  env: EmailEnv,
  to: string,
  subject: string,
  html: string,
) => {
  if (!env.RESEND_API_KEY) {
    return;
  }

  const from = `TurnsOut <hello@${toSenderDomain(env.ECHO_DOMAIN)}>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`failed to send email: ${response.status}`);
  }
};

export const sendVerificationEmail = async (
  env: EmailEnv,
  to: string,
  username: string,
  token: string,
) => {
  const verifyLink = `${toAppBaseUrl(env.ECHO_DOMAIN)}/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail(
    env,
    to,
    "Verify your email",
    getTemplate(
      "Verify your email",
      username,
      "Thanks for joining TurnsOut. To get started, please verify your email address.",
      "Verify Email",
      verifyLink,
    ),
  );
};

export const sendOtpEmail = async (
  env: EmailEnv,
  to: string,
  username: string,
  otp: string,
  magicLinkToken: string,
) => {
  const magicLink = `${toAppBaseUrl(env.ECHO_DOMAIN)}/auth/magic-link?token=${encodeURIComponent(magicLinkToken)}`;

  const otpTtl = Math.floor((Date.now() + 10 * 60 * 1000 - Date.now()) / 60);

  await sendEmail(
    env,
    to,
    "Your sign-in code",
    getTemplate(
      "Your sign-in code",
      username,
      `Use the code below to sign in to TurnsOut. This code expires in ${otpTtl} minutes.`,
      "Sign in with code",
      magicLink,
      `<div style="letter-spacing: 0.25em; font-size: 32px; font-weight: 600; text-align: center; margin: 24px 0; font-family: 'SF Mono', 'Fira Code', monospace;">${otp}</div>

<p class="text">Alternatively, click the button above to sign in automatically.</p>`,
    ),
  );
};

export const sendPasswordResetEmail = async (
  env: EmailEnv,
  to: string,
  username: string,
  token: string,
) => {
  const resetLink = `${toAppBaseUrl(env.ECHO_DOMAIN)}/reset-password?token=${encodeURIComponent(token)}`;

  await sendEmail(
    env,
    to,
    "Reset Your Password",
    getTemplate(
      "Reset your password",
      username,
      "We received a request to reset your password. If you didn't make this request, you can safely ignore this email.",
      "Reset Password",
      resetLink,
    ),
  );
};
