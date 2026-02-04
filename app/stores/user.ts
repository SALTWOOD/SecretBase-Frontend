import { defineStore } from "pinia";
import type { User } from "~/types/user";
import { getUserProfile } from "~~/packages/api/src/sdk.gen";

const initialState = {
  user: null as User | null,
  isLoggedIn: false,
  expires: null as Date | null,
};

export const useUserStore = defineStore("user", {
  persist: true,
  state: () => ({ ...initialState }),
  actions: {
    setUser(info: User) {
      this.user = info;
      this.isLoggedIn = true;
    },

    reset() {
      this.user = null;
      this.isLoggedIn = false;
    },

    async fetch() {
      const response = await getUserProfile();
      if (response.response.status === 401) {
        this.reset();
        return;
      }
      if (!response.error) this.setUser(response.data as User);
    },
  },
});
