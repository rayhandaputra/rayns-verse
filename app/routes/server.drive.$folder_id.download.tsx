// import { zip } from "zip-a-folder";
// import fs from "fs";
// import path from "path";
// import { tmpdir } from "os";
// import type { LoaderFunction } from "react-router";
// import { API } from "~/lib/api";
// import { getOptionalUser } from "~/lib/session.server";
// import { Readable } from "stream";

// export const loader: LoaderFunction = async ({ params, request }) => {
//   const folderId = params.folder_id;

//   if (!folderId) {
//     return new Response("Folder ID is required", { status: 400 });
//   }

//   let tempDir: string | null = null;
//   let zipPath: string | null = null;

//   try {
//     // Get authentication (optional for public access)
//     const authData = await getOptionalUser(request);

//     // Fetch files from the folder
//     const filesRes = await API.ORDER_UPLOAD.get_file({
//       session: authData ? { user: authData.user, token: authData.token } : {},
//       req: {
//         query: {
//           size: 1000,
//           folder_id: folderId,
//         },
//       },
//     });

//     const files = filesRes?.items || [];

//     if (files.length === 0) {
//       return new Response(
//         JSON.stringify({ error: "No files found in this folder" }),
//         {
//           status: 404,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }

//     // Get folder details for naming
//     const folderRes = await API.ORDER_UPLOAD.get_folder({
//       session: authData ? { user: authData.user, token: authData.token } : {},
//       req: {
//         query: {
//           id: folderId,
//           size: 1,
//         },
//       },
//     });

//     const folderName =
//       folderRes?.items?.[0]?.folder_name || `folder-${folderId}`;
//     const sanitizedFolderName = folderName
//       .replace(/[^a-z0-9_-]/gi, "_")
//       .substring(0, 100); // Limit filename length

//     // Create temporary directory
//     tempDir = path.join(tmpdir(), `download-${folderId}-${Date.now()}`);
//     fs.mkdirSync(tempDir, { recursive: true });

//     // Download all files
//     console.log(`[ZIP] Starting download of ${files.length} files...`);
//     let successCount = 0;

//     for (const file of files) {
//       try {
//         const res = await fetch(file.file_url);
//         if (!res.ok) {
//           console.error(`[ZIP] Failed to download: ${file.file_name}`);
//           continue;
//         }
//         const buffer = Buffer.from(await res.arrayBuffer());
//         const sanitizedFileName = file.file_name
//           .replace(/[^a-z0-9._-]/gi, "_")
//           .substring(0, 200); // Limit filename length
//         fs.writeFileSync(path.join(tempDir, sanitizedFileName), buffer);
//         successCount++;
//         console.log(`[ZIP] Downloaded (${successCount}/${files.length}): ${sanitizedFileName}`);
//       } catch (err) {
//         console.error(`[ZIP] Error downloading ${file.file_name}:`, err);
//       }
//     }

//     if (successCount === 0) {
//       return new Response(
//         JSON.stringify({ error: "Failed to download any files" }),
//         {
//           status: 500,
//           headers: { "Content-Type": "application/json" },
//         }
//       );
//     }

//     // Create zip file
//     zipPath = path.join(tmpdir(), `${sanitizedFolderName}-${Date.now()}.zip`);
//     console.log(`[ZIP] Creating zip at: ${zipPath}`);
//     await zip(tempDir, zipPath);

//     // Get file stats
//     const stats = fs.statSync(zipPath);
//     console.log(`[ZIP] Zip created successfully. Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

//     // Read zip file as buffer (synchronously to ensure completion)
//     const zipBuffer = fs.readFileSync(zipPath);
//     console.log(`[ZIP] Zip buffer loaded. Buffer size: ${zipBuffer.length} bytes`);

//     // Cleanup temp directory (but keep zip for now)
//     try {
//       if (tempDir && fs.existsSync(tempDir)) {
//         fs.rmSync(tempDir, { recursive: true, force: true });
//         console.log(`[ZIP] Cleaned up temp directory: ${tempDir}`);
//       }
//     } catch (cleanupErr) {
//       console.error("[ZIP] Cleanup error:", cleanupErr);
//     }

//     // Schedule zip cleanup after response is sent
//     setTimeout(() => {
//       try {
//         if (zipPath && fs.existsSync(zipPath)) {
//           fs.rmSync(zipPath, { force: true });
//           console.log(`[ZIP] Delayed cleanup of zip file: ${zipPath}`);
//         }
//       } catch (cleanupErr) {
//         console.error("[ZIP] Delayed cleanup error:", cleanupErr);
//       }
//     }, 5000); // 5 seconds delay

//     // Return zip file with proper headers for download
//     return new Response(zipBuffer, {
//       status: 200,
//       headers: {
//         "Content-Type": "application/zip; charset=binary",
//         "Content-Disposition": `attachment; filename="${sanitizedFolderName}.zip"`,
//         "Content-Length": zipBuffer.length.toString(),
//         "Cache-Control": "no-cache, no-store, must-revalidate",
//         "Pragma": "no-cache",
//         "Expires": "0",
//       },
//     });
//   } catch (error: any) {
//     console.error("[ZIP] Error creating zip:", error);

//     // Cleanup on error
//     try {
//       if (tempDir && fs.existsSync(tempDir)) {
//         fs.rmSync(tempDir, { recursive: true, force: true });
//       }
//       if (zipPath && fs.existsSync(zipPath)) {
//         fs.rmSync(zipPath, { force: true });
//       }
//     } catch (cleanupErr) {
//       console.error("[ZIP] Cleanup error on failure:", cleanupErr);
//     }

//     return new Response(
//       JSON.stringify({ error: error.message || "Internal server error" }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   }
// };

// export default () => null;
// import type { LoaderFunction } from "@remix-run/node";
// import archiver from "archiver";
// import type { LoaderFunction } from "react-router";
// import { PassThrough } from "stream";

// import { API } from "~/lib/api";
// import { getOptionalUser } from "~/lib/session.server";

// export const loader: LoaderFunction = async ({ params, request }) => {
//   const folderId = params.folder_id;

//   if (!folderId) {
//     return new Response("Folder ID is required", { status: 400 });
//   }

//   try {
//     // Optional auth (public / private)
//     const authData = await getOptionalUser(request);

//     // =========================
//     // GET FILE LIST
//     // =========================
//     const filesRes = await API.ORDER_UPLOAD.get_file({
//       session: authData ? { user: authData.user, token: authData.token } : {},
//       req: {
//         query: {
//           folder_id: folderId,
//           size: 1000,
//         },
//       },
//     });

//     const files = filesRes?.items ?? [];

//     if (files.length === 0) {
//       return new Response(
//         JSON.stringify({ error: "No files found in this folder" }),
//         { status: 404, headers: { "Content-Type": "application/json" } }
//       );
//     }

//     // =========================
//     // GET FOLDER NAME
//     // =========================
//     const folderRes = await API.ORDER_UPLOAD.get_folder({
//       session: authData ? { user: authData.user, token: authData.token } : {},
//       req: {
//         query: { id: folderId, size: 1 },
//       },
//     });

//     const rawFolderName =
//       folderRes?.items?.[0]?.folder_name ?? `folder-${folderId}`;

//     const zipName =
//       rawFolderName.replace(/[^a-z0-9_-]/gi, "_").substring(0, 100) + ".zip";

//     // =========================
//     // CREATE ZIP STREAM
//     // =========================
//     const archive = archiver("zip", { zlib: { level: 9 } });
//     const stream = new PassThrough();

//     archive.on("error", (err) => {
//       console.error("[ZIP] Archiver error:", err);
//       stream.destroy(err);
//     });

//     // Pipe ZIP → HTTP stream
//     archive.pipe(stream);

//     // =========================
//     // APPEND FILES
//     // =========================
//     for (const file of files) {
//       try {
//         const res = await fetch(file.file_url);
//         console.log(res);
//         if (!res.ok) {
//           console.error(`[ZIP] Failed download: ${file.file_name}`);
//           continue;
//         }

//         const buffer = Buffer.from(await res.arrayBuffer());
//         const safeName = file.file_name
//           .replace(/[^a-z0-9._-]/gi, "_")
//           .substring(0, 200);

//         archive.append(buffer, { name: safeName });
//       } catch (err) {
//         console.error(`[ZIP] Error processing ${file.file_name}`, err);
//       }
//     }

//     // Finalize ZIP (VERY IMPORTANT)
//     await archive.finalize();

//     // =========================
//     // RETURN STREAM RESPONSE
//     // =========================
//     return new Response(stream as any, {
//       status: 200,
//       headers: {
//         "Content-Type": "application/zip",
//         "Content-Disposition": `attachment; filename="${zipName}"`,
//         "Cache-Control": "no-store",
//       },
//     });
//   } catch (error: any) {
//     console.error("[ZIP] Fatal error:", error);
//     return new Response(
//       JSON.stringify({ error: error.message ?? "Internal server error" }),
//       { status: 500, headers: { "Content-Type": "application/json" } }
//     );
//   }
// };

// export default () => null;

// import archiver from "archiver";
// import type { ActionFunction } from "react-router";
// import { PassThrough, Readable } from "stream";

// import { API } from "~/lib/api";
// import { getOptionalUser } from "~/lib/session.server";

// export const action: ActionFunction = async ({ params, request }) => {
//   const folderId = params.folder_id;
//   if (!folderId) {
//     return new Response("Folder ID is required", { status: 400 });
//   }

//   try {
//     const authData = await getOptionalUser(request);

//     // =========================
//     // GET FILE LIST
//     // =========================
//     const filesRes = await API.ORDER_UPLOAD.get_file({
//       session: authData ? { user: authData.user, token: authData.token } : {},
//       req: { query: { folder_id: folderId, size: 1000 } },
//     });

//     const files = filesRes?.items ?? [];
//     if (files.length === 0) {
//       return new Response("No files found", { status: 404 });
//     }

//     // =========================
//     // ZIP NAME
//     // =========================
//     const zipName = `folder-${folderId}.zip`;

//     // =========================
//     // ZIP STREAM
//     // =========================
//     const archive = archiver("zip", { zlib: { level: 9 } });
//     const stream = new PassThrough();

//     archive.on("error", (err) => {
//       console.error("[ZIP] Archiver error:", err);
//       stream.destroy(err);
//     });

//     archive.pipe(stream);

//     // =========================
//     // APPEND FILES (FIXED)
//     // =========================
//     for (const file of files) {
//       try {
//         const res = await fetch(file.file_url);

//         if (!res.ok || !res.body) {
//           console.error(`[ZIP] Failed: ${file.file_name}`);
//           continue;
//         }

//         const safeName = file.file_name
//           .replace(/[^a-z0-9._-]/gi, "_")
//           .substring(0, 200);

//         // ✅ CONVERT WebStream → Node Stream
//         const nodeStream = Readable.fromWeb(res.body as any);

//         archive.append(nodeStream, { name: safeName });
//       } catch (err) {
//         console.error(`[ZIP] Error processing ${file.file_name}`, err);
//       }
//     }

//     archive.on("finish", () => console.log("[ZIP] Archive finished"));
//     archive.finalize();

//     // await archive.finalize();
//     console.log(stream);

//     return new Response(stream as any, {
//       headers: {
//         // "Content-Type": "application/zip",
//         // "Content-Disposition": `attachment; filename="${zipName}"`,
//         // "Cache-Control": "no-store",
//         "Content-Disposition": 'attachment; filename="file.zip"',
//         "Content-Type": "application/zip",
//       },
//     });
//   } catch (err) {
//     console.error("[ZIP] Fatal:", err);
//     return new Response("Internal server error", { status: 500 });
//   }
// };

// export default () => null;

// =================================================================================== ACTION REAL SIDE

// import archiver from "archiver";
// import type { ActionFunction } from "react-router";
// import { PassThrough, Readable } from "stream";

// import { API } from "~/lib/api";
// import { getOptionalUser } from "~/lib/session.server";

// export const action: ActionFunction = async ({ params, request }) => {
//   const folderId = params.folder_id;
//   if (!folderId) return new Response("Folder ID is required", { status: 400 });

//   try {
//     const authData = await getOptionalUser(request);
//     const filesRes = await API.ORDER_UPLOAD.get_file({
//       session: authData ? { user: authData.user, token: authData.token } : {},
//       req: { query: { folder_id: folderId, size: 1000 } },
//     });

//     const files = filesRes?.items ?? [];
//     console.log("FILES => ", files)
//     console.log("FILES => ", files?.length)
//     if (files.length === 0) return new Response("No files", { status: 404 });

//     const archive = archiver("zip", { zlib: { level: 5 } }); // Level 5 lebih cepat dari 9
//   const { readable, writable } = new TransformStream();
//   const writer = writable.getWriter();

//   // Pipe data langsung ke writer
//   archive.on("data", (chunk) => writer.write(chunk));
//   archive.on("end", () => writer.close());
//   archive.on("error", (err) => writer.abort(err));

//   // Jalankan proses secara parallel tapi terbatas (misal 5 file sekaligus)
//   const downloadAndAppend = async () => {
//     const pLimit = (await import("p-limit")).default(5); // npm install p-limit
    
//     const tasks = files.map((file) => 
//       pLimit(async () => {
//         try {
//           const res = await fetch(file.file_url);
//           if (res.ok && res.body) {
//             const nodeStream = Readable.fromWeb(res.body as any);
//             archive.append(nodeStream, { name: file.file_name });
//           }
//         } catch (e) {
//           console.error(`Gagal ambil file: ${file.file_name}`, e);
//         }
//       })
//     );

//     await Promise.all(tasks);
//     await archive.finalize();
//   };

//   downloadAndAppend(); // Tetap jalankan async

//   return new Response(readable, {
//     headers: {
//       "Content-Type": "application/zip",
//       "Content-Disposition": `attachment; filename="download.zip"`,
//       "X-Content-Type-Options": "nosniff",
//     },
//   });
//   } catch (err) {
//     return new Response("Internal Server Error", { status: 500 });
//   }
// };

import { type LoaderFunctionArgs } from "react-router";
import archiver from "archiver";
import { PassThrough, Readable } from "node:stream";
import { API } from "~/lib/api";
import { getOptionalUser } from "~/lib/session.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const folderId = params.folder_id;
  if (!folderId) throw new Response("Folder ID Required", { status: 400 });

  const authData = await getOptionalUser(request);

  // 1. Ambil list file
  const filesRes = await API.ORDER_UPLOAD.get_file({
    session: authData ? { user: authData.user, token: authData.token } : {},
    req: { query: { folder_id: folderId, size: 1000 } },
  });

  const files = filesRes?.items ?? [];
  if (files.length === 0) throw new Response("Folder kosong", { status: 404 });

  // 2. Setup Archiver & Bridge Stream
  const archive = archiver("zip", { zlib: { level: 5 } }); // Level 5: Balance antara speed & kompresi
  const passThrough = new PassThrough();

  // Konversi Node Stream ke Web ReadableStream
  const stream = Readable.toWeb(passThrough);

  // 3. Proses penarikan file (Async)
  // Kita tidak menggunakan 'await' pada fungsi ini agar Response bisa segera dikirim ke browser
  (async () => {
    try {
      for (const file of files) {
        const res = await fetch(file.file_url);
        if (res.ok && res.body) {
          // Konversi body fetch (Web Stream) ke Node Stream untuk archiver
          const nodeStream = Readable.fromWeb(res.body as any);
          archive.append(nodeStream, { name: file.file_name });
        }
      }
      await archive.finalize();
    } catch (err) {
      console.error("Zip Error:", err);
      archive.destroy();
    }
  })();

  // Pipe archiver ke passThrough
  archive.pipe(passThrough);

  const folderName = files[0]?.folder_name || `folder-${folderId}`;

  // 4. Return Response Stream
  return new Response(stream as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${folderName}.zip"`,
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
};
