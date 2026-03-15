import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Bell, FileText, Home, MapPin, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/posts", label: "Posty", icon: FileText },
  { href: "/admin/users", label: "Użytkownicy", icon: Users },
  { href: "/admin/places", label: "Miejsca", icon: MapPin },
  { href: "/admin/achievements", label: "Osiągnięcia", icon: Trophy },
  { href: "/admin/notifications", label: "Powiadomienia", icon: Bell },
];

export const metadata: Metadata = {
  title: "Panel administracyjny",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const admin = await prisma.admin.findUnique({
    where: {
      userId: userId,
    },
  });

  if (!admin) {
    return notFound();
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <div className="flex">
        <aside className="bg-background sticky top-0 h-screen w-64 border-r">
          <div className="p-6 pb-0">
            <h1 className="text-xl font-bold">Lokaltu Admin</h1>
          </div>
          <nav className="space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:bg-muted flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
