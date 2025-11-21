// app/server/auth.server.ts

// example dummy login API
export async function verifyLogin(email: string) {
  if (email === "rayhandaputra10@gmail.com") {
    return { token: "FAKE_TOKEN_123", userId: 1 };
  }
  return null;
}

export async function getSessionUser(token: string) {
  if (token === "FAKE_TOKEN_123") {
    return {
      id: 1,
      name: "Administrator",
      role: "admin",
    };
  }
  return null;
}

export async function deleteSession(token: string) {
  // optionally revoke session in DB
  return true;
}
