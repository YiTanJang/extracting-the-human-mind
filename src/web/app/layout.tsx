import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마음 추출 파일럿",
  description: "Extracting the Human Mind — 친구 대상 연구 파일럿",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f3ea",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-28 pt-8">{children}</main>
      </body>
    </html>
  );
}
