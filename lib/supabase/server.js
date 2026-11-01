import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Membuat koneksi Supabase untuk server memakai SUPABASE_URL dan SUPABASE_SECRET_KEY.
 * Digunakan untuk membaca data publik (seperti katalog dan detail produk) di sisi server.
 */
export function createServerClient() {
  const rawUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!rawUrl || !supabaseSecretKey) {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_SECRET_KEY belum diatur di environment variable."
    );
  }

  // Normalisasi URL jika berakhiran /rest/v1 atau slash
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Membuat koneksi sesi admin memakai SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, dan cookie.
 * Digunakan untuk login, keluar, ganti password, dan aksi admin lainnya.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();
  const rawUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!rawUrl || !publishableKey) {
    throw new Error(
      "SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY belum diatur di environment variable."
    );
  }

  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  return createSSRClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Dipanggil dari Server Component saat cookie tidak bisa diubah
        }
      },
    },
  });
}

export const createPublicClient = createServerClient;
export const getSupabaseClient = createServerClient;
export const createAdminClient = createSessionClient;
export const createAuthClient = createSessionClient;
