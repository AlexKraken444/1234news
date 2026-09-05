import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1234 NEWS — новости нашего класса",
  description: "Самое важное, смешное и интересное из жизни нашего класса.",
  icons: { icon: "/icon.png", apple: "/icon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
