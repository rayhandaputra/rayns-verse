import { createContext, useContext } from "react";

// Tipe data user (samakan dengan DB kamu)
export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
}

// Context untuk user
export const userContext = createContext<User | null>(null);

// Hook untuk akses context
export function useUser() {
  return useContext(userContext);
}
