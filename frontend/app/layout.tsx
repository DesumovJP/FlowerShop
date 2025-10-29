import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ThemeProvider from './components/ThemeProvider';

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://phoenix-flowers.ua"),
  title: {
    default: "Phoenix — Інтернет-магазин квітів у Києві",
    template: "%s | Phoenix"
  },
  description: "Квіти та букети з доставкою по Києву. Замовляйте онлайн: 08:00–20:00, м. Київ, вул. Ризька, 1. Телефон: +380501627774.",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: "/",
    siteName: "Phoenix",
    title: "Phoenix — квіти та букети з доставкою у Києві",
    description: "Замовляйте квіти та букети з доставкою. Адреса: вул. Ризька, 1. Телефон: +380501627774.",
    images: [{ url: "/vercel.svg", width: 1200, height: 630, alt: "Phoenix" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Phoenix — Інтернет-магазин квітів у Києві",
    description: "Квіти та букети з доставкою по Києву. 08:00–20:00. Тел.: +380501627774.",
    images: ["/vercel.svg"]
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body
        className={`${poppins.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
