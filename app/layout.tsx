import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Kalnia, Urbanist } from "next/font/google";
import "./globals.css";

const kalnia = Kalnia({ variable: "--font-kalnia", subsets: ["latin"] });
const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lokaltu.pl";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Lokaltu",
  title: {
    default: "Lokaltu | Lokalnie, zdrowo i odpowiedzialnie",
    template: "%s | Lokaltu",
  },
  description:
    "Lokaltu pomaga kupować lokalnie, oszczędzać jednorazowe torby i zdobywać punkty za odpowiedzialne zakupy.",
  keywords: [
    "lokalne zakupy",
    "ekologiczne zakupy",
    "torba wielorazowa",
    "lokalni producenci",
    "Lokaltu",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "Lokaltu",
    url: "/",
    title: "Lokaltu | Lokalnie, zdrowo i odpowiedzialnie",
    description:
      "Kupuj lokalnie, skanuj zakupy i śledź swój pozytywny wpływ dzięki aplikacji Lokaltu.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lokaltu | Lokalnie, zdrowo i odpowiedzialnie",
    description:
      "Kupuj lokalnie i zdobywaj punkty za ekologiczne wybory z Lokaltu.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pl">
        <body
          className={`${kalnia.variable} ${urbanist.className} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
