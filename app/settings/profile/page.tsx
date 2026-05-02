"use client";

import Image from "next/image";
import { useSettings } from "@/components/settings/settings-provider";
import { CAMPUSES } from "@/lib/settings/campuses";
import { readImageAsDataUrl } from "@/lib/settings/image";
import { supabase } from "@/supabaseClient";
import { useEffect, useRef, useState } from "react";

export default function ProfileSettingsPage() {
  const { settings, update } = useSettings();
  const [imageError, setImageError] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState(false);
  const mountedRef = useRef(true);
  // Browser timers are numeric IDs; `NodeJS.Timeout` from Node types does not match `window.setTimeout`.
  const savedHintTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (savedHintTimerRef.current !== null) {
        window.clearTimeout(savedHintTimerRef.current);
      }
    };
  }, []);

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      update({ avatarDataUrl: dataUrl });
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (userId) {
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_url: dataUrl })
          .eq("id", userId);
        if (error && mountedRef.current) {
          setImageError("Saved locally, but could not sync avatar to profile.");
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setImageError(err instanceof Error ? err.message : "Could not load image");
    }
    e.target.value = "";
  }

  async function onBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await readImageAsDataUrl(file);
      if (!mountedRef.current) return;
      update({ bannerDataUrl: dataUrl });
    } catch (err) {
      if (!mountedRef.current) return;
      setImageError(err instanceof Error ? err.message : "Could not load image");
    }
    e.target.value = "";
  }

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    update({
      displayName: settings.displayName.trim(),
      bio: settings.bio.trim(),
      campusId: settings.campusId,
    });
    setSavedHint(true);
    if (savedHintTimerRef.current !== null) {
      window.clearTimeout(savedHintTimerRef.current);
    }
    savedHintTimerRef.current = window.setTimeout(() => {
      if (!mountedRef.current) return;
      setSavedHint(false);
      savedHintTimerRef.current = null;
    }, 2000);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Profile</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Edit how you appear to study partners on campus.
      </p>

      <div className="mt-6 space-y-6">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
          <div className="relative h-32 w-full bg-gradient-to-r from-violet-200 to-indigo-200 dark:from-violet-950 dark:to-indigo-950">
            {settings.bannerDataUrl ? (
              <Image
                src={settings.bannerDataUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>
          <div className="flex flex-col gap-4 px-4 pb-4 pt-0 sm:flex-row sm:items-end">
            <div className="-mt-10 relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-zinc-200 dark:border-zinc-950 dark:bg-zinc-800">
              {settings.avatarDataUrl ? (
                <Image
                  src={settings.avatarDataUrl}
                  alt=""
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-medium text-zinc-500">
                  {settings.displayName
                    ? settings.displayName.slice(0, 1).toUpperCase()
                    : "?"}
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 pt-2 sm:pt-0">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Profile photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={onAvatarChange}
                  className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:text-zinc-400 dark:file:bg-zinc-100 dark:file:text-zinc-900"
                />
              </label>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Banner image
                <input
                  type="file"
                  accept="image/*"
                  onChange={onBannerChange}
                  className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-full file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white dark:text-zinc-400 dark:file:bg-zinc-100 dark:file:text-zinc-900"
                />
              </label>
            </div>
          </div>
        </div>

        {imageError ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {imageError}
          </p>
        ) : null}

        <form onSubmit={saveProfile} className="flex max-w-lg flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Display name
            </span>
            <input
              value={settings.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Alex Student"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Bio</span>
            <textarea
              value={settings.bio}
              onChange={(e) => update({ bio: e.target.value })}
              rows={4}
              className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="CS junior · night study sessions · MIT ’27"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Campus
            </span>
            <select
              value={settings.campusId}
              onChange={(e) => update({ campusId: e.target.value })}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">Select your campus</option>
              {CAMPUSES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.state}
                </option>
              ))}
            </select>
          </label>
          {savedHint ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
              Profile saved.
            </p>
          ) : null}
          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Save profile
          </button>
        </form>
      </div>
    </div>
  );
}
