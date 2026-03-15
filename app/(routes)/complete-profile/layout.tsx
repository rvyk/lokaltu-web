import type { Metadata } from "next";
import { CompleteProfileShell } from "./_components/complete-profile-shell";

export const metadata: Metadata = {
  title: "Uzupełnienie profilu",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompleteProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CompleteProfileShell>{children}</CompleteProfileShell>;
}
