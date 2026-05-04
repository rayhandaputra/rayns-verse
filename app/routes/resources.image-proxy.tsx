// app/routes/resources.image-proxy.ts
import { type LoaderFunction } from "react-router"; // Sesuaikan import dengan versi remix Anda

export const loader: LoaderFunction = async ({ request }) => {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
        return new Response("Missing URL parameter", { status: 400 });
    }

    try {
        const response = await fetch(targetUrl);

        if (!response.ok) {
            return new Response("Failed to fetch image", { status: response.status });
        }

        // Ambil content-type asli (image/png, image/jpeg, dll)
        const contentType = response.headers.get("content-type") || "application/octet-stream";

        // Return sebagai stream/blob ke frontend
        return new Response(response.body, {
            headers: {
                "Content-Type": contentType,
                // Cache control agar tidak fetch ulang terus menerus
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return new Response("Error fetching image", { status: 500 });
    }
};