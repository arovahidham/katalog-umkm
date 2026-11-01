"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Memastikan sesi admin valid sebelum menjalankan aksi yang mengubah data di server.
 */
export async function requireAuth() {
  const supabase = await createSessionClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false, error: "Anda harus login untuk melakukan aksi ini." };
  }

  return { authorized: true, supabase, user };
}

export async function login(prevState, formData) {
  let data = formData;
  if (!data && prevState && typeof prevState.get === "function") {
    data = prevState;
  }

  const email = data?.get("email")?.toString()?.trim();
  const password = data?.get("password")?.toString();

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message?.toLowerCase().includes("invalid login credentials")) {
      return { error: "Email atau password salah. Silakan periksa kembali." };
    }
    return { error: error.message || "Gagal masuk. Silakan coba lagi." };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export const keluar = logout;

export async function gantiPassword(prevState, formData) {
  let data = formData;
  if (!data && prevState && typeof prevState.get === "function") {
    data = prevState;
  }

  const passwordBaru = data?.get("password_baru")?.toString() || "";
  const konfirmasiPassword = data?.get("konfirmasi_password")?.toString() || "";

  if (!passwordBaru || passwordBaru.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  if (passwordBaru !== konfirmasiPassword) {
    return { error: "Password baru dan konfirmasi password tidak sama." };
  }

  // Wajib memeriksa status login admin di server sebelum mengubah password
  const auth = await requireAuth();
  if (!auth.authorized) {
    return { error: auth.error };
  }

  const { error } = await auth.supabase.auth.updateUser({
    password: passwordBaru,
  });

  if (error) {
    return { error: error.message || "Gagal mengganti password. Silakan coba lagi." };
  }

  return { success: "Password berhasil diganti." };
}

export const changePassword = gantiPassword;
