"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { LogOut, User } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/customer/auth");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#333] border-t-[#ededed]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
          <User className="h-7 w-7 text-[#444]" />
        </div>
        <p className="mt-5 text-[16px] font-extralight text-[#ededed]">Not signed in</p>
        <button
          onClick={() => router.push("/customer/auth")}
          className="mt-8 rounded-full border border-[#ededed] px-8 py-3.5 text-[12px] font-light tracking-[0.2em] text-[#ededed] transition-all duration-300 hover:bg-[#ededed] hover:text-black"
        >
          SIGN IN
        </button>
      </div>
    );
  }

  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Customer";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex min-h-full flex-col bg-black">
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-[22px] font-extralight tracking-[-0.01em] text-[#ededed]">Profile</h1>
      </div>

      {/* Avatar + info */}
      <div className="flex flex-col items-center py-8">
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={name}
            className="h-20 w-20 rounded-full border border-[#1a1a1a] object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0a0a0a]">
            <span className="text-xl font-extralight text-[#555]">{initials}</span>
          </div>
        )}
        <p className="mt-4 text-[18px] font-extralight text-[#ededed]">{name}</p>
        <p className="mt-1 text-[13px] font-light text-[#555]">{user.email}</p>
      </div>

      {/* Settings rows */}
      <div className="mx-5 rounded-2xl border border-[#1a1a1a] overflow-hidden">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-[#0a0a0a]"
        >
          <LogOut className="h-4 w-4 text-[#555]" />
          <span className="text-[14px] font-light text-[#888]">Sign out</span>
        </button>
      </div>

      <div className="mt-auto px-5 pb-8 pt-8 text-center">
        <p className="text-[11px] font-light tracking-[0.15em] text-[#333]">VENTZON</p>
      </div>
    </div>
  );
}
