import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MeCart | The Atelier of Modern Commerce",
  description:
    "MeCart is a curated atelier for fashion, audio, timepieces and technology — considered objects, live inventory and atelier care on every order.",
  applicationName: "MeCart",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "MeCart",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0f" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var stored=localStorage.getItem('mecart-theme');var dark=stored?stored==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',dark);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        <a className="lx-skip-link" href="#main">
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4200}
          offset={18}
          gap={10}
          visibleToasts={4}
          toastOptions={{
            className: "font-sans lx-toast",
            classNames: {
              toast: "lx-toast",
              title: "lx-toast-title",
              description: "lx-toast-description",
              actionButton: "lx-toast-action",
              cancelButton: "lx-toast-cancel",
              closeButton: "lx-toast-close",
            },
          }}
        />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
