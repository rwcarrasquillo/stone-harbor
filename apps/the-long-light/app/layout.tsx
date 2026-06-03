import type { Metadata } from "next";
import "./globals.css";
import { MarketingAnalytics } from "@/app/components/marketingAnalytics";
import { LongLightCrisisFooter } from "@/app/components/longLightCrisisFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://thelonglight.app"),
  title: {
    default: "The Long Light — A private place to think, when the day has been long",
    template: "%s · The Long Light",
  },
  description:
    "The Long Light is a private journal and reflective space for women in difficult chapters. Patient, unhurried, never performative. Free.",
  applicationName: "The Long Light",
  authors: [{ name: "The Long Light" }],
  openGraph: {
    title: "The Long Light — The light stays. So can you.",
    description:
      "A private place to think, when the day has been long. For women in divorce, grief, identity transitions, and the quieter forms of being lost.",
    siteName: "The Long Light",
    url: "https://thelonglight.app",
    type: "website",
    locale: "en_US",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="long-light" className="h-full antialiased">
      <body className="flex min-h-screen flex-col">
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        <LongLightCrisisFooter />
        <MarketingAnalytics />
      </body>
    </html>
  );
}
