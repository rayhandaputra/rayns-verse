// import type { Route } from "./+types/_index";
// import { Welcome } from "../welcome/welcome";
// import { Link } from "react-router";
// import { Link } from "@remix-run/react";

// export function meta({}: Route.MetaArgs) {
//   return [
//     { title: "New React Router App" },
//     { name: "description", content: "Welcome to React Router!" },
//   ];
// }

import { motion } from "framer-motion";

export default function ComingSoon() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center text-white p-8"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold drop-shadow-lg">
          🚀 Coming Soon
        </h1>
        <p className="mt-4 text-lg md:text-2xl font-medium opacity-90">
          Website <span className="font-bold">Kinau.id</span> sedang dalam pengembangan
        </p>
        <div className="mt-8">
          <button
            className="px-6 py-3 inline-flex items-center gap-2 cursor-pointer bg-white text-indigo-600 font-semibold rounded-full shadow-lg hover:scale-105 transition-transform"
            onClick={() => window.open("https://wa.me/6285219337474", "_blank")}
          >
            <img src="/whatsapp-icon.svg" className="w-4 h-4" /> Hubungi Admin
          </button>
        </div>
      </motion.div>
    </div>
  );
}
