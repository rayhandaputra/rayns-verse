import { redirect } from "react-router";
import { userContext } from "~/context";
// import { getUserById } from "~/models/user.server";
import { unsealSession } from "~/lib/session";

export const authMiddleware = async ({ request, context }: any) => {
  const session = await unsealSession(request);
  const userId = session.userId; // langsung property, bukan .get()

  if (!userId) {
    throw redirect("/login");
  }

//   const user = await getUserById(userId);
  const user = { id: 0, username: "testuser", email: "", role: "user" };
  context.set(userContext, user);
};
