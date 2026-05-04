export const generateHeader = (session: any) => ({
  "Content-Type": "application/json",
  "x-auth-token": session?.session?.auth_session || "",
  "x-auth-role": session?.role || "",
});
