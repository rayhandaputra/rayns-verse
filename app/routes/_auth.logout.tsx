// import type { ActionFunctionArgs } from "@remix-run/node";
// import { redirect } from "@remix-run/node";
import type { ActionFunction } from "react-router";
import { redirect } from "react-router";
import { destroySession, getSession } from "~/lib/session";

export const action: ActionFunction = async ({ request }) => {
  try {
    const session = await getSession(request.headers.get("Cookie"));
    // Jika kamu menyimpan session di cookie, hapus di sini
    // Contoh (jika pakai cookie session):
    return redirect("/", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });

    // Jika hanya client-side token, bisa arahkan langsung
    // Di sini kamu juga bisa hit API logout jika ada

    // return redirect("/"); // redirect ke halaman utama (_index.tsx)
  } catch (err: any) {
    return Response.json(
      { success: false, error: err.message ?? "Gagal logout" },
      { status: 500 }
    );
  }
};
