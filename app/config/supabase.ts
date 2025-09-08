// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  //   process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://vnyyelomkxbzzqlfxhoy.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZueXllbG9ta3hienpxbGZ4aG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NjUxMTYsImV4cCI6MjA3MTE0MTExNn0.jmqOYru6gnnm3yJj9hofsMv3DurjHZzOD-ZRKO76Yoo";

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Optional: export helpers like auth & db (biar mirip firebase)
export const auth = supabase.auth;
export const db = supabase; // karena supabase langsung jadi db client
