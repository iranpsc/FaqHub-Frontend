// app/layout.tsx
import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavigationProgress } from "@/components/NavigationProgress";
import { getServerAuth } from "@/lib/serverAuth";
import { azarMehr, rokh } from '../fonts/localFonts';
import { JsonLd } from '@/components/JsonLd';
import { organizationSchema } from '@/lib/schema';

export const metadata: Metadata = {
  title: "انجمن حم - بزرگترین انجمن پرسش و پاسخ ایران",
  description: "انجمن حم بزرگترین انجمن پرسش و پاسخ ایران",
  metadataBase: new URL("https://faqhub.ir"),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: initialUser, token: initialToken } = await getServerAuth();

  return (
    <html lang="fa" dir="rtl">
      <body className={`${azarMehr.variable} ${rokh.variable} antialiased`}>
        <JsonLd data={organizationSchema()} />
        <AuthProvider initialUser={initialUser} initialToken={initialToken}>
          <NavigationProgress />
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
