import { client } from "@secret-base/api/src/client.gen";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  client.setConfig({
    baseUrl: config.public.apiBase as string,
    credentials: "include",
  });

  client.interceptors.response.use(async (response, request) => {
    if (!response.ok) {
      console.log(response);
      if (response.status === 428) {
        const data = await response
          .clone()
          .json()
          .catch(() => ({}));
        console.log(data);
        if (data.type !== "2fa_challenge") return response;
        const { openChallengeModal } = useChallenge();

        if (openChallengeModal.value) {
          const result = await openChallengeModal.value();

          if (result) {
            if (!data?.noRetry) {
              return await fetch(request.url, {
                method: request.method,
                headers: request.headers,
              });
            } else return response;
          }
        }
        return response;
      }
    }
    return response;
  });

  client.interceptors.response.use(async (response) => {
    if (!response.ok) {
      const data = await response
        .clone()
        .json()
        .catch(() => ({}));
      const description = data?.message
        ? `Status ${response.status}: ${data.message}`
        : `Status ${response.status}`;
      console.error(`[API Error] Status: ${response.status}`);
      useToast().add({
        title: "API Error",
        description,
        color: "error",
      });
    }
    return response;
  });
});
