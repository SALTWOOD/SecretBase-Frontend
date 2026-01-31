export interface User {
  id: number | string;
  username: string;
  email: string;
  role: UserRole;
  isBanned: boolean;
  registerTime: string | Date;
  avatar?: string | null;
}
