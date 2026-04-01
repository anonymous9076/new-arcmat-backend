function normalizeResponse(req, res, next) {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  function normalize(payload) {
    if (payload === null || payload === undefined) return { status: "failed", message: "No content" };
    if (typeof payload !== "object") return { status: "successful", data: payload };

    if (payload.status && (payload.data !== undefined || payload.message !== undefined)) {
      return payload;
    }

    const keys = Object.keys(payload).map((k) => k.toLowerCase());
    if (keys.includes("status")) {
      const s = String(payload.status).toLowerCase();
      if (s.includes("fail")) {
        return { status: "failed", message: payload.errors || payload.message || payload.error || payload };
      }
      return { status: "successful", data: payload.data || payload };
    }

    return { status: "successful", data: payload };
  }

  function pickStatusCode(normalized) {
    // If controller already set a status (via res.status), keep it
    if (res.statusCode && res.statusCode !== 200) return res.statusCode;

    // If normalized indicates failure, map to an appropriate code
    if (normalized && normalized.status === "failed") {
      // Validation-like payloads
      const msg = String(normalized.message || "").toLowerCase();
      if (msg.includes("validation") || msg.includes("validationerror") || msg.includes("invalid")) return 422;
      if (msg.includes("not found") || msg.includes("notfound") || msg.includes("missing")) return 404;
      if (msg.includes("unauthorized") || msg.includes("unauthorised") || msg.includes("permission")) return 401;
      if (msg.includes("forbidden")) return 403;
      // default server error for failures without clear cause
      return 500;
    }

    // success paths: default 200
    return 200;
  }

  res.json = (payload) => {
    try {
      const normalized = normalize(payload);
      const code = pickStatusCode(normalized);
      res.status(code);
      return originalJson(normalized);
    } catch (err) {
      res.status(500);
      return originalJson({ status: "failed", message: "Response normalization error" });
    }
  };

  res.send = (payload) => {
    if (typeof payload === "string" || Buffer.isBuffer(payload)) {
      return originalSend(payload);
    }
    try {
      const normalized = normalize(payload);
      const code = pickStatusCode(normalized);
      res.status(code);
      return originalJson(normalized);
    } catch (err) {
      res.status(500);
      return originalJson({ status: "failed", message: "Response normalization error" });
    }
  };

  next();
}

export default normalizeResponse;

