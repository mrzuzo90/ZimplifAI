/** URL pública del sitio (sin barra final). Vercel la inyecta vía NEXT_PUBLIC_SITE_URL. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://zimplifai.vercel.app").replace(/\/+$/, "");
