export function createShortcodeApi(shortcodeName: string) {
  return new Proxy(
    {} as Record<string, (data?: unknown) => Promise<unknown>>,
    {
      get(_, handlerName: string) {
        if (typeof handlerName !== "string") return undefined;
        return async (data?: unknown) => {
          const result = await $fetch<{
            success: boolean;
            data?: unknown;
            error?: { code: string; message: string };
          }>(`/api/v1/shortcodes/${shortcodeName}/handlers/${handlerName}`, {
            method: "POST",
            body: data ?? {},
          });
          if (!result.success) {
            const err = result.error ?? { code: "UNKNOWN", message: "Unknown error" };
            throw new Error(`[${err.code}] ${err.message}`);
          }
          return result.data;
        };
      },
    },
  );
}
