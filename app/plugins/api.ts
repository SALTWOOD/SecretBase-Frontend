import { client } from "@secret-base/api/src/client.gen";

export default defineNuxtPlugin(() => {
  client.setConfig({
    baseUrl: "/api/v1",
  });

  client.interceptors.response.use(async (response, request) => {
    if (!response.ok) {
      if (response.status === 428) {
        const data = await response
          .clone()
          .json()
          .catch(() => ({}));
        if (data.type !== "2fa_challenge") return response;

        if (request.body) return response;

        const { openChallengeModal } = useChallenge();

        if (openChallengeModal.value) {
          const result = await openChallengeModal.value();

          if (result) {
            return await fetch(request.url, {
              method: request.method,
              headers: request.headers,
            });
          }
        }
        return response;
      }

      console.error(`[API Error] Status: ${response.status}`);
      useToast().add({
        title: "API Error",
        description: `Status: ${response.status}`,
        color: "error",
      });
    }
    return response;
  });
});
