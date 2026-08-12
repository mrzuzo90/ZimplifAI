import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { BrandingProvider } from "@/context/BrandingContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToaster } from "@/components/theme/ThemeToaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const APP_NAME = "ZimplifAI CRM";
const APP_DESCRIPTION =
  "Plataforma multi-tenant de ZimplifAI: provisiona CRMs white-label, bots de IA y reservas en 1 clic para negocios locales.";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  robots: { index: false, follow: false },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#CEFF00",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        {/* Anti-FOUC: aplica el tema antes de que React hidrate. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("zimplifai:theme");if(t==="light"||(!t&&matchMedia("(prefers-color-scheme: light)").matches))document.documentElement.setAttribute("data-theme","light");}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <BrandingProvider>
            <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
          </BrandingProvider>
          <ThemeToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
