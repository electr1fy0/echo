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
  logoUrl?: string,
) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0c0c0d !important; }
      .email-card { background-color: #18181b !important; border-color: #27272a !important; }
      .email-header-text { color: #fafafa !important; }
      .email-title { color: #fafafa !important; }
      .email-text { color: #a1a1aa !important; }
      .email-divider { border-color: #27272a !important; }
      .email-fallback-label { color: #52525b !important; }
      .email-fallback-link { color: #a1a1aa !important; }
      .email-footer-text { color: #52525b !important; }
      .email-otp { color: #fafafa !important; }
    }
  </style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f4; width: 100%;">
    <tr>
      <td align="center" style="padding: 48px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">
          <tr>
            <td class="email-card" style="background-color: #ffffff; border-radius: 16px; padding: 48px; border: 1px solid #e4e4e7; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);">

              <!-- Header: Logo + Brand -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 28px; border-bottom: 1px solid #f0f0f0;" class="email-divider">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        ${logoUrl ? `<td style="vertical-align: middle; padding-right: 12px;">
                          <img src="${logoUrl}" alt="" width="32" height="32" style="display: block; width: 32px; height: 32px; border-radius: 8px;">
                        </td>` : ''}
                        <td style="vertical-align: middle;">
                          <span class="email-header-text" style="font-size: 18px; font-weight: 600; color: #09090b; letter-spacing: -0.02em;">TurnsOut</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-top: 28px;">
                    <h1 class="email-title" style="font-size: 20px; font-weight: 600; color: #09090b; margin: 0 0 8px 0; letter-spacing: -0.02em;">${title}</h1>
                    <p class="email-text" style="font-size: 15px; font-weight: 400; color: #52525b; margin: 16px 0; line-height: 1.6;">Hi ${username},</p>
                    <p class="email-text" style="font-size: 15px; font-weight: 400; color: #52525b; margin: 16px 0; line-height: 1.6;">${content}</p>
                    ${extraContent ? `<div style="margin: 24px 0;">${extraContent}</div>` : ''}

                    <!-- CTA Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                      <tr>
                        <td>
                          <a href="${actionUrl}" style="display: inline-block; background: #ff5a1f; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-size: 14px; font-weight: 500; letter-spacing: -0.01em; border: 1px solid rgba(255, 255, 255, 0.15); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.3);">${actionText}</a>
                        </td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p class="email-fallback-label" style="font-size: 13px; font-weight: 400; color: #a1a1aa; margin: 32px 0 8px 0; line-height: 1.5;">If the button above doesn't work, copy and paste this link:</p>
                    <p style="font-size: 13px; margin: 0; word-break: break-all;">
                      <a href="${actionUrl}" class="email-fallback-link" style="color: #52525b; text-decoration: underline; text-underline-offset: 3px;">${actionUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-top: 32px; margin-top: 32px; border-top: 1px solid #f0f0f0;" class="email-divider">
                    <p class="email-footer-text" style="font-size: 12px; font-weight: 400; color: #a1a1aa; margin: 0; line-height: 1.5;">&copy; TurnsOut. All rights reserved.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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
  const baseUrl = toAppBaseUrl(env.ECHO_DOMAIN);
  const verifyLink = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const logoUrl = `${baseUrl}/turnsout.svg`;

  await sendEmail(
    env,
    to,
    "Verify your email — TurnsOut",
    getTemplate(
      "Verify your email",
      username,
      "Thanks for joining TurnsOut. To get started, please verify your email address.",
      "Verify Email",
      verifyLink,
      undefined,
      logoUrl,
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
  const baseUrl = toAppBaseUrl(env.ECHO_DOMAIN);
  const magicLink = `${baseUrl}/auth/magic-link?token=${encodeURIComponent(magicLinkToken)}`;
  const logoUrl = `${baseUrl}/turnsout.svg`;

  const otpTtl = 10;

  await sendEmail(
    env,
    to,
    "Your sign-in code — TurnsOut",
    getTemplate(
      "Your sign-in code",
      username,
      `Use the code below to sign in to TurnsOut. This code expires in ${otpTtl} minutes.`,
      "Sign in with code",
      magicLink,
      `<div class="email-otp" style="letter-spacing: 0.25em; font-size: 36px; font-weight: 600; text-align: center; margin: 24px 0; font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace; color: #09090b;">${otp}</div>

<p style="font-size: 15px; font-weight: 400; color: #52525b; margin: 16px 0; line-height: 1.6; text-align: center;">Alternatively, click the button above to sign in automatically.</p>`,
      logoUrl,
    ),
  );
};

export const sendEmailChangeOtp = async (
  env: EmailEnv,
  to: string,
  username: string,
  otp: string,
) => {
  const logoUrl = `${toAppBaseUrl(env.ECHO_DOMAIN)}/turnsout.svg`;

  await sendEmail(
    env,
    to,
    "Verify your email change — TurnsOut",
    getTemplate(
      "Verify your email change",
      username,
      "We received a request to change your email address. Use the code below to verify this change.",
      "Copy code",
      "#",
      `<div class="email-otp" style="letter-spacing: 0.25em; font-size: 36px; font-weight: 600; text-align: center; margin: 24px 0; font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace; color: #09090b;">${otp}</div>`,
      logoUrl,
    ),
  );
};

export const sendEmailChangeNotification = async (
  env: EmailEnv,
  to: string,
  username: string,
) => {
  const baseUrl = toAppBaseUrl(env.ECHO_DOMAIN);
  const logoUrl = `${baseUrl}/turnsout.svg`;

  await sendEmail(
    env,
    to,
    "Your email was changed — TurnsOut",
    getTemplate(
      "Your email was changed",
      username,
      "Your TurnsOut account email was recently changed. If you didn't make this change, please contact support immediately.",
      "Go to TurnsOut",
      baseUrl,
      undefined,
      logoUrl,
    ),
  );
};

export const sendPasswordResetEmail = async (
  env: EmailEnv,
  to: string,
  username: string,
  token: string,
) => {
  const baseUrl = toAppBaseUrl(env.ECHO_DOMAIN);
  const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const logoUrl = `${baseUrl}/turnsout.svg`;

  await sendEmail(
    env,
    to,
    "Reset your password — TurnsOut",
    getTemplate(
      "Reset your password",
      username,
      "We received a request to reset your password. If you didn't make this request, you can safely ignore this email.",
      "Reset Password",
      resetLink,
      undefined,
      logoUrl,
    ),
  );
};
