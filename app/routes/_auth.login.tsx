// import type { ActionFunctionArgs } from "@remix-run/node";
// import { json } from "@remix-run/node";
// import axios from "axios";
import { redirect, type ActionFunction } from "react-router";
import { API } from "~/lib/api";
import { commitSession, getSession } from "~/lib/session";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  // const session = {};
  try {
    //   const url = new URL(request.url);
    // const search = url.searchParams.get("q") ?? "";
    // let query = db.from("users").select("*");
    //   query = query.eq("email", "rayhandaputra10@gmail.com");
    // const { data: users, error } = await query;

    const res = (
      (await API.USER.get({
        session: {},
        req: {
          query: {
            size: 1,
            email: email as string,
            pagination: "true",
          },
        },
      })) as any
    )?.items?.[0];

    const session = await getSession(request.headers.get("Cookie"));
    session.set("user", { ...res });

    return Response.json({
      success: true,
      message: `Berhasil Login 🎉, selamat datang ${email}`,
      user: res,
    });
  } catch (err: any) {
    console.log(err);
    return Response.json(
      { success: false, error: err.response?.data?.message ?? "Server error" },
      { status: err.response?.status ?? 500 }
    );
  }
};
