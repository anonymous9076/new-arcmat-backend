const normalizeIndianMobile = (mobile) => {
  if (!mobile) return null;
  const digits = String(mobile).replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return null;
};

const cleanEnv = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^['"]|['"]$/g, "");
};

export const sendOTPMessage = async (mobile, otp) => {
  const normalizedMobile = normalizeIndianMobile(mobile);
  if (!normalizedMobile) {
    return { success: false, error: "Invalid mobile number format" };
  }

  const authKey = cleanEnv(process.env.MSG91_AUTH_KEY);
  const templateId = cleanEnv(process.env.MSG91_OTP_TEMPLATE_ID);
  const senderId = cleanEnv(process.env.MSG91_SENDER_ID) || "ARCMAT";

  if (!authKey || !templateId) {
    // If running locally without SMS gateway credentials, print the OTP to the console and succeed
    console.log(`\n--- [LOCAL DEVELOPMENT OTP BYPASS] ---`);
    console.log(`Recipient: ${mobile}`);
    console.log(`OTP Code:  ${otp}`);
    console.log(`-------------------------------------\n`);
    return {
      success: true,
      data: {
        request_id: "mock_request_id_" + Date.now(),
        message: "Message Sent Successfully"
      }
    };
  }

  // console.log("MSG91 template:", templateId, "sender:", senderId);

  try {
    const response = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        template_id: templateId,
        sender: senderId,
        short_url: "0",
        recipients: [
          {
            mobiles: normalizedMobile,
            OTP: String(otp)
          }
        ]
      })
    });

    const raw = await response.text();
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      parsed = { message: raw };
    }

    const isSuccess =
      response.ok &&
      !parsed.error &&
      (
        parsed.type === "success" ||
        parsed.success === true ||
        parsed.request_id ||
        parsed.message === "Message Sent Successfully"
      );

    if (!isSuccess) {
      return {
        success: false,
        error: parsed.message || parsed.type || "Failed to send OTP SMS"
      };
    }

    return { success: true, data: parsed };
  } catch (error) {
    return { success: false, error: error.message || "SMS service unavailable" };
  }
};
