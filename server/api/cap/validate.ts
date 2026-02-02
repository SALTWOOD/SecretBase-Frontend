import cap from "~~/server/utils/cap";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const body = await readBody(event);
  const { token, secret } = body || {};
  if (!token || !secret) {
    setResponseStatus(event, 400);
    return { success: false, message: "Missing token or secret" };
  }
  if (secret !== config.capSecretKey) {
    setResponseStatus(event, 403);
    return { success: false, message: "Invalid secret" };
  }
  const result = await cap.validateToken(token);

  return result;
});
