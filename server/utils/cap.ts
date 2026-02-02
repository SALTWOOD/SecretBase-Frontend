import Cap from "@cap.js/server";

const challengesStore = new Map<string, { data: any; expires: number }>();
const tokensStore = new Map<string, number>();

const cap = new Cap({
  storage: {
    challenges: {
      store: async (token, challengeData) => {
        challengesStore.set(token, {
          data: challengeData,
          expires: challengeData.expires,
        });
      },

      read: async (token) => {
        const item = challengesStore.get(token);

        if (item && item.expires > Date.now()) {
          return { challenge: item.data, expires: Number(item.expires) };
        }

        if (item) challengesStore.delete(token);
        return null;
      },

      delete: async (token) => {
        challengesStore.delete(token);
      },

      deleteExpired: async () => {
        const now = Date.now();
        for (const [token, item] of challengesStore.entries()) {
          if (item.expires <= now) {
            challengesStore.delete(token);
          }
        }
      },
    },

    tokens: {
      store: async (tokenKey, expires) => {
        tokensStore.set(tokenKey, expires);
      },

      get: async (tokenKey) => {
        const expires = tokensStore.get(tokenKey);

        if (expires && expires > Date.now()) {
          return Number(expires);
        }

        if (expires) tokensStore.delete(tokenKey);
        return null;
      },

      delete: async (tokenKey) => {
        tokensStore.delete(tokenKey);
      },

      deleteExpired: async () => {
        const now = Date.now();
        for (const [key, expires] of tokensStore.entries()) {
          if (expires <= now) {
            tokensStore.delete(key);
          }
        }
      },
    },
  },
});

export default cap;
