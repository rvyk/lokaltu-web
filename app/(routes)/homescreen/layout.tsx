import type { Metadata } from "next";
import Navbar from "./_components/navbar";

export const metadata: Metadata = {
  title: "Panel użytkownika",
  robots: {
    index: false,
    follow: false,
  },
};

export default function HomeScreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Navbar />
    </>
  );
}
