export const generateHeader = (session: any) => {
  const token = session?.token || session?.session?.auth_session || "";
  
  let role = session?.role || "";
  if (!role && session?.user) {
    let u = session.user;
    if (typeof u === "string") {
      try {
        u = JSON.parse(u);
      } catch (e) {}
    }
    role = u?.role || "";
  }

  return {
    "Content-Type": "application/json",
    "x-auth-token": token,
    "x-auth-role": role,
  };
};

