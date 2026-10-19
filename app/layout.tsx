import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import NavBar from "@/components/Navbar";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Vocalutor — Talk to an AI tutor out loud",
    template: "%s | Vocalutor",
  },
  description: "Talk to an AI tutor out loud. Pick a subject, start a voice session, and learn by conversation instead of reading.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} antialiased`}>
        <ClerkProvider appearance={{variables:{ colorPrimary: '#fe5933'}} }>
        <NavBar />
        {children}
        </ClerkProvider>
        </body>
    </html>
  );
}
