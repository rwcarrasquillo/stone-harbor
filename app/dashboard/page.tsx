"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Cormorant_Garamond, Inter } from "next/font/google";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type Profile = {
  email: string | null;
  display_name: string | null;
  username: string | null;
  role: string | null;
  bio: string | null;
  location: string | null;
  healing_stage: string | null;
  privacy_level: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  work?: string | null;
  work_company_name?: string | null;
  work_company_logo_url?: string | null;
  work_company_domain?: string | null;
  education?: string | null;
  hometown?: string | null;
  relationship_status?: string | null;
  website?: string | null;
  languages?: string | null;
  interests?: string | null;
};

type CoverImage = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

type DailyQuote = {
  quote_text: string;
  theme: string;
  category: string | null;
};

type DashboardCardProps = {
  href: string;
  label: string;
  title: string;
  text: string;
  badge?: number;
};

function normalizeHealingStage(value: string | null | undefined) {
  const stage = value?.trim().toLowerCase();

  if (stage === "calm") return "Calm";
  if (stage === "strength" || stage === "strenght") return "Strength";

  return "Clarity";
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [coverImages, setCoverImages] = useState<CoverImage[]>([]);
  const [currentCoverIndex, setCurrentCoverIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [introExpanded, setIntroExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [quoteStage, setQuoteStage] = useState("Clarity");
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const activeCover = useMemo(() => {
    return (
      coverImages[currentCoverIndex]?.image_url || profile?.cover_url || ""
    );
  }, [coverImages, currentCoverIndex, profile?.cover_url]);

  const activeCoverDetails = coverImages[currentCoverIndex] || null;

  async function loadUnreadMessageCount() {
    const { data, error } = await supabase.rpc("get_unread_message_count");

    if (error) {
      console.error("Could not load unread message count:", error.message);
      setUnreadMessageCount(0);
      return;
    }

    setUnreadMessageCount(data ?? 0);
  }

  async function loadDailyQuote(healingStageValue: string | null | undefined) {
    const today = new Date().toISOString().split("T")[0];
    const normalizedStage = normalizeHealingStage(healingStageValue);

    setQuoteStage(normalizedStage);

    const { data, error } = await supabase
      .from("daily_quotes")
      .select("quote_text, theme, category")
      .eq("quote_date", today)
      .eq("audience", "men")
      .eq("theme", normalizedStage)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Daily quote error:", error.message);
      setDailyQuote(null);
      return;
    }

    if (data) {
      setDailyQuote(data);
      return;
    }

    const { data: fallbackQuote, error: fallbackError } = await supabase
      .from("daily_quotes")
      .select("quote_text, theme, category")
      .eq("quote_date", today)
      .eq("audience", "men")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (fallbackError) {
      console.error("Fallback quote error:", fallbackError.message);
      setDailyQuote(null);
      return;
    }

    setDailyQuote(fallbackQuote);
  }

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select(
        "email, display_name, username, role, bio, location, healing_stage, privacy_level, avatar_url, cover_url, work, work_company_name, work_company_logo_url, work_company_domain, education, hometown, relationship_status, website, languages, interests",
      )
      .eq("id", user.id)
      .single();

    const loadedProfile: Profile = {
      email: data?.email ?? user.email ?? null,
      display_name: data?.display_name ?? null,
      username: data?.username ?? null,
      role: data?.role ?? "member",
      bio: data?.bio ?? null,
      location: data?.location ?? null,
      healing_stage: data?.healing_stage ?? null,
      privacy_level: data?.privacy_level ?? "private",
      avatar_url: data?.avatar_url ?? null,
      cover_url: data?.cover_url ?? null,
      work: data?.work ?? null,
      work_company_name: data?.work_company_name ?? null,
      work_company_logo_url: data?.work_company_logo_url ?? null,
      work_company_domain: data?.work_company_domain ?? null,
      education: data?.education ?? null,
      hometown: data?.hometown ?? null,
      relationship_status: data?.relationship_status ?? null,
      website: data?.website ?? null,
      languages: data?.languages ?? null,
      interests: data?.interests ?? null,
    };

    setProfile(loadedProfile);
    await loadCoverImages(user.id, loadedProfile.cover_url);
    await loadDailyQuote(loadedProfile.healing_stage);
    await loadUnreadMessageCount();
    setLoading(false);
  }

  async function loadCoverImages(
    currentUserId: string,
    currentCoverUrl: string | null,
  ) {
    const { data, error } = await supabase
      .from("profile_cover_images")
      .select("id, user_id, image_url, caption, created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      setCoverImages([]);
      return;
    }

    const images = data ?? [];
    setCoverImages(images);

    if (currentCoverUrl && images.length > 0) {
      const activeIndex = images.findIndex(
        (image) => image.image_url === currentCoverUrl,
      );

      setCurrentCoverIndex(activeIndex >= 0 ? activeIndex : 0);
    } else {
      setCurrentCoverIndex(0);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function useCurrentImageAsCover() {
    if (!userId || !activeCoverDetails) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        cover_url: activeCoverDetails.image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      alert(`Could not update cover: ${error.message}`);
      return;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            cover_url: activeCoverDetails.image_url,
          }
        : prev,
    );
  }

  function previousCover() {
    if (coverImages.length <= 1) return;

    setCurrentCoverIndex((current) =>
      current === 0 ? coverImages.length - 1 : current - 1,
    );
  }

  function nextCover() {
    if (coverImages.length <= 1) return;

    setCurrentCoverIndex((current) =>
      current === coverImages.length - 1 ? 0 : current + 1,
    );
  }

  function formatLabel(value: string | null | undefined) {
    if (!value) return "Not set";
    return value.replaceAll("_", " ");
  }

  function formatDateTime(dateValue: string | null | undefined) {
    if (!dateValue) return "No date available";

    return new Date(dateValue).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`dashboard-unread-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async () => {
          await loadUnreadMessageCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3efe7]">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-stone-600">
          Loading Harbor...
        </p>
      </main>
    );
  }

  return (
    <main
      className={`${sans.className} min-h-screen bg-[#f3efe7] px-4 py-8 text-stone-900 md:px-8`}
    >
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="/"
            className="text-sm font-bold uppercase tracking-[0.35em] text-[#a9793d]"
          >
            ← Stone Harbor
          </a>

          <div className="flex flex-wrap gap-3">
            <a
              href="/welcome"
              className="rounded-none border border-stone-300 bg-white/70 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-stone-700 transition hover:border-[#a9793d] hover:bg-white"
            >
              Edit Profile
            </a>

            <a
              href="/messages"
              className="relative rounded-none border border-stone-300 bg-white/70 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-stone-700 transition hover:border-[#a9793d] hover:bg-white"
            >
              Messages
              {unreadMessageCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center border border-[#c4934e] bg-[#a9793d] px-2 text-[10px] font-black text-white">
                  {unreadMessageCount}
                </span>
              )}
            </a>

            <button
              onClick={handleLogout}
              className="rounded-none border border-stone-300 bg-white/70 px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-stone-700 transition hover:border-[#a9793d] hover:bg-white"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-none border border-stone-200 bg-[#f8f4ed] shadow-[0_20px_70px_rgba(0,0,0,0.08)]">
          <div
            className="group relative h-64 bg-cover bg-center"
            style={{
              backgroundImage: activeCover
                ? `url(${activeCover})`
                : "linear-gradient(135deg, #d8b07b, #8d6432)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />

            {coverImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    previousCover();
                  }}
                  className="absolute left-5 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/15 text-lg text-white/70 opacity-0 backdrop-blur-md transition duration-300 hover:bg-black/25 hover:text-white group-hover:opacity-100"
                  aria-label="Previous cover image"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    nextCover();
                  }}
                  className="absolute right-5 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/15 text-lg text-white/70 opacity-0 backdrop-blur-md transition duration-300 hover:bg-black/25 hover:text-white group-hover:opacity-100"
                  aria-label="Next cover image"
                >
                  ›
                </button>
              </>
            )}

            <div
              onClick={() => activeCover && setViewerOpen(true)}
              className="absolute inset-0 cursor-pointer"
            />

            <div className="absolute bottom-5 right-5 z-20 rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 opacity-0 backdrop-blur-md transition duration-300 group-hover:opacity-100">
              {coverImages.length > 0
                ? `${currentCoverIndex + 1} of ${coverImages.length}`
                : "No Cover History"}
            </div>

            <div className="absolute -bottom-14 left-8">
              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-[#f8f4ed] bg-[#efe8dc] shadow-xl">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile avatar"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-5xl text-[#a9793d]">⚓</span>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 pt-16">
            <div className="grid gap-8 md:grid-cols-[1.05fr_auto_0.95fr] md:items-start">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#a9793d]">
                  Member Home
                </p>

                <h1
                  className={`${serif.className} mt-3 text-5xl font-medium leading-tight text-stone-900 md:text-7xl`}
                >
                  {profile?.display_name || "Stone Harbor Member"}
                </h1>

                <p className="mt-1 text-sm font-bold uppercase tracking-[0.22em] text-stone-400">
                  {profile?.username ? `@${profile.username}` : profile?.email}
                </p>

                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm font-semibold text-stone-500">
                  <span>{profile?.location || "Location not set"}</span>
                  <span>•</span>
                  <span className="capitalize">
                    {formatLabel(profile?.healing_stage)}
                  </span>
                  <span>•</span>
                  <span className="capitalize">
                    {formatLabel(profile?.privacy_level)}
                  </span>
                </div>
              </div>

              <div className="hidden w-px self-stretch bg-stone-200 md:block" />

              <div className="border-t border-stone-200 pt-6 md:border-t-0 md:pt-0">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#a9793d]">
                  Perspective
                </p>

                <p className="text-base leading-relaxed text-stone-700 md:text-lg">
                  {profile?.bio ||
                    "Welcome to your private harbor. This is your space to rebuild, reflect, and reconnect with who you are becoming."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-10">
          <div className="rounded-none border border-stone-200 bg-gradient-to-br from-[#f8f4ed] via-[#f3efe7] to-[#efe8dc] px-6 py-7 shadow-[0_14px_40px_rgba(0,0,0,0.06)] md:px-10 md:py-8">
            <div className="mx-auto max-w-5xl text-center">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.38em] text-[#a9793d]">
                Today&apos;s Reflection
              </p>

              {dailyQuote ? (
                <>
                  <p
                    className={`${serif.className} mx-auto max-w-[1100px] text-xl font-medium leading-[1.15] tracking-[-0.015em] text-stone-900 md:text-3xl xl:text-[2.65rem]`}
                    style={{
                      fontStyle: "italic",
                      wordBreak: "keep-all",
                    }}
                  >
                    “{dailyQuote.quote_text}”
                  </p>

                  <div className="mt-4 flex justify-center">
                    <span className="border border-[#c4934e]/35 bg-white/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#a9793d] shadow-sm">
                      {dailyQuote.theme}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p
                    className={`${serif.className} mx-auto max-w-4xl text-xl font-medium leading-[1.15] tracking-[-0.015em] text-stone-900 md:text-3xl`}
                    style={{
                      fontStyle: "italic",
                    }}
                  >
                    Your reflection is being prepared.
                  </p>

                  <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-stone-500">
                    No active quote was found for today&apos;s {quoteStage}{" "}
                    stage. Generate this week&apos;s reflections and refresh
                    your harbor.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <div
          className={`mt-8 grid items-stretch gap-8 ${
            introExpanded ? "lg:grid-cols-[0.85fr_1.15fr]" : "lg:grid-cols-1"
          }`}
        >
          <aside className="relative flex h-full flex-col rounded-none border border-white/70 bg-white p-7 shadow-[0_16px_60px_rgba(0,0,0,0.06)]">
            <button
              type="button"
              onClick={() => setIntroExpanded((current) => !current)}
              className="absolute right-5 top-5 text-2xl leading-none text-[#a9793d] transition hover:text-[#8d6432]"
              aria-label={
                introExpanded
                  ? "Contract intro section"
                  : "Expand intro section"
              }
              title={introExpanded ? "Contract intro" : "Expand intro"}
            >
              {introExpanded ? "⌃" : "⌄"}
            </button>

            <div className="mb-6 flex items-center justify-between pr-8">
              <h2
                className={`${serif.className} text-4xl font-medium text-stone-900`}
              >
                Anchor
              </h2>
            </div>

            {introExpanded ? (
              <div className="flex flex-1 flex-col divide-y divide-stone-200">
                <AboutRow icon="⚑" label="Lives in" value={profile?.location} />
                <AboutRow icon="◬" label="From" value={profile?.hometown} />

                <AboutRow
                  icon="⚒"
                  label="Work"
                  value={profile?.work_company_name || profile?.work}
                  logoUrl={profile?.work_company_logo_url}
                  domain={profile?.work_company_domain}
                />

                <AboutRow
                  icon="⌬"
                  label="Education"
                  value={profile?.education}
                />

                <AboutRow
                  icon="⊹"
                  label="Relationship"
                  value={formatLabel(profile?.relationship_status)}
                />

                <AboutRow icon="◎" label="Website" value={profile?.website} />
                <AboutRow
                  icon="⋄"
                  label="Languages"
                  value={profile?.languages}
                />
                <AboutRow
                  icon="✢"
                  label="Interests"
                  value={profile?.interests}
                />
              </div>
            ) : null}
          </aside>

          <section className="h-full">
            <div
              className={`grid h-full gap-6 ${
                introExpanded
                  ? "md:grid-cols-2 md:grid-rows-2"
                  : "md:grid-cols-2 xl:grid-cols-4"
              }`}
            >
              <DashboardCard
                href="/journal"
                label="Private"
                title="Journal"
                text="Write, search, and revisit private reflections only you can access."
              />

              <DashboardCard
                href="/messages"
                label={
                  unreadMessageCount > 0
                    ? `${unreadMessageCount} Unread`
                    : "Private"
                }
                title="Messages"
                text={
                  unreadMessageCount > 0
                    ? "You have unread member messages waiting."
                    : "Start private conversations with other Stone Harbor members."
                }
                badge={unreadMessageCount}
              />

              <DashboardCard
                href="/members-blog"
                label="Members"
                title="Blog"
                text="Read protected articles and join thoughtful member discussions."
              />

              <DashboardCard
                href="/welcome"
                label="Identity"
                title="Profile"
                text="Update your avatar, cover image, privacy defaults, and healing stage."
              />
            </div>
          </section>
        </div>
      </section>

      {viewerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/90">
          <button
            type="button"
            onClick={() => setViewerOpen(false)}
            className="absolute right-6 top-6 z-20 rounded-none border border-white/30 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.25em] text-white backdrop-blur-xl transition hover:bg-white/20"
          >
            Close
          </button>

          {coverImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={previousCover}
                className="absolute left-6 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-none border border-white/30 bg-white/10 text-3xl text-white backdrop-blur-xl transition hover:bg-white/20"
                aria-label="Previous image"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={nextCover}
                className="absolute right-6 top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-none border border-white/30 bg-white/10 text-3xl text-white backdrop-blur-xl transition hover:bg-white/20"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          <div
            className="h-full w-full bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: activeCover
                ? `url(${activeCover})`
                : "linear-gradient(135deg, #d8b07b, #8d6432)",
            }}
          />

          <div className="absolute bottom-8 left-8 max-w-xl rounded-none border border-white/20 bg-black/35 p-6 text-white backdrop-blur-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-[#f4d7a1]">
              Cover Image
            </p>

            <h2 className={`${serif.className} text-4xl font-medium`}>
              {activeCoverDetails?.caption || "Profile Cover"}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-white/80">
              Uploaded: {formatDateTime(activeCoverDetails?.created_at)}
            </p>

            <p className="mt-1 text-sm leading-relaxed text-white/80">
              Image {coverImages.length > 0 ? currentCoverIndex + 1 : 0} of{" "}
              {coverImages.length}
            </p>

            {activeCoverDetails?.image_url === profile?.cover_url ? (
              <p className="mt-4 rounded-none border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/90">
                Current Active Cover
              </p>
            ) : (
              <button
                type="button"
                onClick={useCurrentImageAsCover}
                className="mt-4 rounded-none bg-[#a9793d] px-6 py-3 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#8d6432]"
              >
                Use as Cover
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function AboutRow({
  icon,
  label,
  value,
  logoUrl,
  domain,
}: {
  icon: string;
  label: string;
  value?: string | null;
  logoUrl?: string | null;
  domain?: string | null;
}) {
  const fallbackLogo =
    domain && `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  return (
    <div className="flex gap-5 py-5">
      <div className="min-w-[42px] pt-[2px] text-3xl font-light leading-none text-stone-500">
        {logoUrl || fallbackLogo ? (
          <img
            src={logoUrl || fallbackLogo || ""}
            alt=""
            className="h-9 w-9 rounded-full object-contain"
            onError={(event) => {
              if (fallbackLogo) {
                event.currentTarget.src = fallbackLogo;
              }
            }}
          />
        ) : (
          icon
        )}
      </div>

      <div>
        <p className="text-sm font-bold uppercase tracking-[0.28em] text-[#a9793d]">
          {label}
        </p>

        <p className="mt-2 text-lg font-medium leading-relaxed text-stone-800">
          {value || "Not added yet"}
        </p>

        {domain && (
          <p className="mt-1 text-xs font-semibold text-stone-400">{domain}</p>
        )}
      </div>
    </div>
  );
}

function DashboardCard({
  href,
  label,
  title,
  text,
  badge = 0,
}: DashboardCardProps) {
  return (
    <a
      href={href}
      className="group relative flex h-full flex-col rounded-none border border-white/70 bg-white p-7 shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition duration-300 hover:-translate-y-1 hover:border-[#a9793d]/40 hover:shadow-[0_18px_55px_rgba(0,0,0,0.09)]"
    >
      {badge > 0 && (
        <span className="absolute right-5 top-5 flex h-8 min-w-8 items-center justify-center border border-[#c4934e] bg-[#a9793d] px-2 text-xs font-black text-white shadow-[0_8px_20px_rgba(169,121,61,0.35)]">
          {badge}
        </span>
      )}

      <p className="mb-4 pr-10 text-sm font-bold uppercase tracking-[0.25em] text-[#a9793d]">
        {label}
      </p>

      <h3 className={`${serif.className} text-4xl font-medium text-stone-900`}>
        {title}
      </h3>

      <p className="mt-4 flex-1 leading-relaxed text-stone-600">{text}</p>

      <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-stone-400 transition group-hover:text-[#a9793d]">
        Open →
      </p>
    </a>
  );
}
