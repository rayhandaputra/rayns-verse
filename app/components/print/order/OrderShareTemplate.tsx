// import React, { forwardRef } from "react";

// interface OrderShareCardProps {
//   order: any;
//   qrCodeUrl: string;
// }

// const OrderShareCard = forwardRef<HTMLDivElement, OrderShareCardProps>(
//   ({ order, qrCodeUrl }, ref) => {
//     return (
//       /* Container tersembunyi */
//       <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
//         <div
//           ref={ref}
//           className="bg-white border shadow-sm flex flex-col items-center overflow-hidden"
//           style={{
//             width: "450px",
//             fontFamily:
//               '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
//             borderRadius: "24px", // Border radius lebih halus
//           }}
//         >
//           {/* Header Indigo: Menggunakan width 100% tanpa margin negatif yang merusak layout */}
//           <div className="bg-indigo-600 w-full py-6 px-4 text-center">
//             <h1 className="text-white font-bold text-xl uppercase tracking-wider">
//               {order?.institution_name || "Tanpa Instansi"}
//             </h1>
//           </div>

//           {/* Body Content */}
//           <div className="p-8 flex flex-col items-center w-full">
//             <div className="flex flex-col items-center mb-6">
//               <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
//                 DRIVE DOCUMENT ACCESS
//               </span>
//               <p className="text-sm font-mono text-gray-400">
//                 #{order?.order_number}
//               </p>
//             </div>

//             {/* QR Code Wrapper dengan Border Halus */}
//             <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-gray-100 mb-6 shadow-sm">
//               {qrCodeUrl ? (
//                 <img src={qrCodeUrl} alt="QR Code" className="w-52 h-52" />
//               ) : (
//                 <div className="w-52 h-52 bg-gray-50 flex items-center justify-center text-gray-300 italic text-sm">
//                   Generating QR...
//                 </div>
//               )}
//             </div>

//             {/* Info Link */}
//             <div className="text-center w-full bg-gray-50 p-4 rounded-xl">
//               <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">
//                 Public Drive Link
//               </p>
//               <p className="text-sm text-indigo-600 font-semibold break-all">
//                 kinau.id/public/drive-link/{order?.order_number}
//               </p>
//             </div>

//             {/* Footer */}
//             <div className="mt-8 pt-4 border-t border-gray-100 w-full text-center">
//               <p className="text-[10px] text-gray-400 leading-relaxed">
//                 Arahkan kamera smartphone Anda ke QR Code di atas
//                 <br />
//                 untuk mengakses folder dokumen secara instan.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }
// );

// OrderShareCard.displayName = "OrderShareCard";
// export default OrderShareCard;
import React, { forwardRef } from "react";
import TemplateQRLink from "../../../../public/template-qr-link.png";

interface OrderShareCardProps {
  order: any;
  qrCodeUrl: string;
}

const OrderShareCard = forwardRef<HTMLDivElement, OrderShareCardProps>(
  ({ order, qrCodeUrl }, ref) => {
    // Gunakan URL gambar template Anda (sebaiknya simpan di folder public atau gunakan Base64)
    const templateUrl = "./template-qr-link.png";

    return (
      /* Container tersembunyi */
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div
          ref={ref}
          style={{
            width: "500px", // Sesuaikan dengan rasio gambar template Anda
            height: "625px", // Sesuaikan dengan rasio gambar template Anda
            backgroundImage: `url(${TemplateQRLink})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            fontFamily: "Arial, sans-serif",
            overflow: "hidden",
          }}
        >
          {/* 1. Nama Pelanggan / Institusi */}
          <div
            style={{
              position: "absolute",
              top: "118px", // Atur koordinat Y agar pas di kotak putih atas
              left: "50%",
              transform: "translateX(-50%)",
              width: "320px",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "18px",
                fontWeight: "800",
                color: "#1a1a1a",
                margin: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {order?.pic_name || "Pelanggan Kinau"}
            </h1>
          </div>

          {/* 2. QR Code */}
          <div
            style={{
              position: "absolute",
              top: "185px", // Atur koordinat Y agar pas di kotak putih tengah (besar)
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                style={{ width: "215px", height: "215px" }}
              />
            ) : (
              <div
                style={{
                  width: "215px",
                  height: "215px",
                  background: "#f3f4f6",
                }}
              />
            )}
          </div>

          {/* 3. Link Drive Teks */}
          <div
            style={{
              position: "absolute",
              top: "421px", // Atur koordinat Y agar pas di kotak putih bawah (kecil)
              left: "50%",
              transform: "translateX(-50%)",
              width: "300px",
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: "9px",
                fontWeight: "600",
                color: "#4b5563",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              kinau.id/public/drive-link/{order?.order_number}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

OrderShareCard.displayName = "OrderShareCard";
export default OrderShareCard;
