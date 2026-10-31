"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export default function AdSenseScript() {
  const pathname = usePathname();
  if (pathname?.startsWith("/cv")) return null;

  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7635423594730192"
      crossOrigin="anonymous"
    />
  );
}
