

import { type LoaderFunctionArgs } from "react-router";
import archiver from "archiver";
import { PassThrough, Readable } from "node:stream";
import { API } from "~/nexus";
import { getOptionalUser } from "~/utils/session.server";

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
