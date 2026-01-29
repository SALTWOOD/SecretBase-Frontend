import { defineStore } from "pinia";

export enum UserRole {
  GUEST = 0,
  USER = 1,
  ADMIN = 2
}

export interface User {
  id: number | string;
  username: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
  registerTime: string | Date;
  avatar?: string | null;
}

const initialState = {
  user: null as User | null,
  isLoggedIn: false
};

export const useUserStore = defineStore('user', {
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
    }
  }
});
