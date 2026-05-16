const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "";
};

export const verifyTurnstileToken = async (token, req) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { success: false, reason: "Turnstile secret is not configured." };
  }

  if (!token) {
    return { success: false, reason: "CAPTCHA token is required." };
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: getClientIp(req)
      })
    });

    if (!response.ok) {
      return { success: false, reason: "CAPTCHA validation failed." };
    }

    const result = await response.json();
    if (!result.success) {
      return { success: false, reason: "CAPTCHA verification unsuccessful." };
    }

    return { success: true };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { success: false, reason: "Could not verify CAPTCHA. Please try again." };
  }
};
