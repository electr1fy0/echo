type EmailEnv = {
  ECHO_DOMAIN?: string;
  RESEND_API_KEY?: string;
};

export const sendVerificationEmail = async (
  _env: EmailEnv,
  _to: string,
  _username: string,
  _token: string,
) => {};

export const sendOtpEmail = async (
  _env: EmailEnv,
  _to: string,
  _username: string,
  _otp: string,
  _magicLinkToken: string,
) => {};

export const sendEmailChangeOtp = async (
  _env: EmailEnv,
  _to: string,
  _username: string,
  _otp: string,
) => {};

export const sendEmailChangeNotification = async (
  _env: EmailEnv,
  _to: string,
  _username: string,
) => {};

export const sendPasswordResetEmail = async (
  _env: EmailEnv,
  _to: string,
  _username: string,
  _token: string,
) => {};

