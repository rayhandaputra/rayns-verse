import type { Route } from "./+types/_index";
import { Welcome } from "../welcome/welcome";
import { Link } from "react-router";
// import { Link } from "@remix-run/react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">Welcome to Rayns Verse</h1>
      <p className="text-lg mb-6">This is the home page.</p>
      <Link to="/login" className="text-blue-500 hover:underline">
        Go to Login
      </Link>
      <Welcome />
    </div>
  );
}
