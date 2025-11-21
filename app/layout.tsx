import type { Metadata } from "next";
import { Geist, Geist_Mono, Mountains_of_Christmas } from "next/font/google";
import "./globals.css";
import clsx from "clsx";
import { LanguageProvider } from "@/components/language-provider";
import Image from "next/image";
import { Snowfall } from "@/components/ui/snowfall";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const mountains = Mountains_of_Christmas({
  variable: "--font-mountains",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Advent of Prompt",
  description: "15 Days of AI Prompt Challenges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={clsx(
          geistSans.variable,
          geistMono.variable,
          mountains.variable,
          "antialiased text-christmas-cream min-h-screen relative overflow-x-hidden"
        )}
      >
        <Snowfall />
        {/* Background Trees Image */}
        <div className="fixed -bottom-20 -left-40 w-full pointer-events-none -z-10 flex flex-row">
          <Image
            src="/trees.png"
            alt="Christmas Trees Background"
            width={500}
            height={400}
            className="relative -bottom-10 h-auto object-cover object-bottom"
            priority
          />
          <Image
            src="/trees.png"
            alt="Christmas Trees Background"
            width={500}
            height={400}
            className="h-auto object-cover object-bottom"
            priority
          />
          <Image
            src="/trees.png"
            alt="Christmas Trees Background"
            width={500}
            height={400}
            className="relative bottom-10h-auto object-cover object-bottom"
            priority
          />
          <Image
            src="/trees.png"
            alt="Christmas Trees Background"
            width={500}
            height={400}
            className="h-auto object-cover object-bottom"
            priority
          />
          <Image
            src="/trees.png"
            alt="Christmas Trees Background"
            width={500}
            height={400}
            className="h-auto object-cover object-bottom"
            priority
          />
          <Image
            src="/trees.png"
            alt="Christmas Trees Background"
            width={500}
            height={400}
            className="h-auto object-cover object-bottom"
            priority
          />
        </div>

        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
