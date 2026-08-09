import { SITE_TEMPLATE_LABELS, type SiteVerticalTemplate, type TenantSiteContent } from "@/types/database";

/**
 * Dominio puro del Motor de Sitio Web Vertical (light_web_editor).
 * Contenido por defecto por plantilla + utilidades de slug.
 */

/** Origen del lead en la etiqueta de captación del sitio público. */
export const SITE_LEAD_SOURCE = "website_digital_menu";

/** Contenido por defecto de la plantilla de gastronomía / carta digital. */
export function restaurantContent(): TenantSiteContent {
  return {
    hero: {
      headline: "Bienvenidos a nuestro restaurante",
      subheadline: "Cocina de temporada, brasa y producto de proximidad. Reserva tu mesa online.",
      badge: "Reserva online disponible",
      bg_image: "",
      cta_text: "Reservar Mesa",
    },
    sections: { show_menu: true, show_hours: true, show_location: true, show_booking: true },
    menu_items: [
      { category: "Entrantes", name: "Croquetas de Jamón", description: "Caseras y cremosas (6 ud)", price: 12.5, image: "" },
      { category: "Entrantes", name: "Ensaladilla rusa", description: "Receta de la abuela con bonito del norte", price: 9.9, image: "" },
      { category: "Principales", name: "Chuletón de Vaca madurada", description: "1kg a la piedra con guarnición", price: 58, image: "" },
      { category: "Principales", name: "Arroz de marisco", description: "Para compartir, con carabinero y alioli", price: 26, image: "" },
      { category: "Postres", name: "Tarta de queso al horno", description: "Con mermelada de frutos rojos", price: 7.5, image: "" },
    ],
    business_hours: [
      { day: "Lunes a Viernes", hours: "13:00 - 16:30 | 20:00 - 23:30" },
      { day: "Sábados y Domingos", hours: "13:00 - 24:00" },
    ],
    contact: {
      address: "Calle Principal 123, Madrid",
      phone: "+34 600 000 000",
      whatsapp: "+34 600 000 000",
      google_maps_url: "",
    },
    menu_pdf_url: "",
  };
}

/** Contenido por defecto de la plantilla de servicios / consultoría. */
export function serviceCatalogContent(): TenantSiteContent {
  return {
    hero: {
      headline: "Servicios que resuelven tu problema",
      subheadline: "Consultoría, salud y servicios profesionales. Precios claros y sin sorpresas.",
      badge: "Valoración gratuita",
      bg_image: "",
      cta_text: "Pedir Presupuesto",
    },
    sections: { show_menu: true, show_hours: true, show_location: true, show_booking: true },
    menu_items: [
      { category: "Servicios", name: "Consulta inicial", description: "Primera valoración sin compromiso", price: 0, image: "" },
      { category: "Servicios", name: "Plan mensual", description: "Acompañamiento continuo con informe trimestral", price: 190, image: "" },
      { category: "Servicios", name: "Proyecto llave en mano", description: "Presupuesto cerrado con entregables definidos", price: 1200, image: "" },
    ],
    business_hours: [
      { day: "Lunes a Viernes", hours: "09:00 - 18:00" },
      { day: "Sábado", hours: "10:00 - 14:00" },
    ],
    contact: {
      address: "Avenida de los Servicios 45, Madrid",
      phone: "+34 610 111 222",
      whatsapp: "+34 610 111 222",
      google_maps_url: "",
    },
    menu_pdf_url: "",
  };
}

/** Contenido por defecto de la plantilla de captación de leads. */
export function leadFunnelContent(): TenantSiteContent {
  return {
    hero: {
      headline: "Consigue más clientes hoy",
      subheadline: "Cuéntanos qué necesitas y te respondemos en menos de 1 hora.",
      badge: "Respuesta rápida por WhatsApp",
      bg_image: "",
      cta_text: "Solicitar Contacto",
    },
    sections: { show_menu: true, show_hours: true, show_location: true, show_booking: true },
    menu_items: [
      { category: "Servicios", name: "Captación de leads", description: "Generamos contactos cualificados cada mes", price: 490, image: "" },
      { category: "Servicios", name: "Automatización con IA", description: "Responde y cualifica por WhatsApp 24/7", price: 290, image: "" },
    ],
    business_hours: [
      { day: "Lunes a Viernes", hours: "09:00 - 19:00" },
    ],
    contact: {
      address: "Calle Digital 10, Madrid",
      phone: "+34 620 222 333",
      whatsapp: "+34 620 222 333",
      google_maps_url: "",
    },
    menu_pdf_url: "",
  };
}

/** Contenido por defecto según la plantilla seleccionada. */
export function defaultContentForTemplate(template: SiteVerticalTemplate): TenantSiteContent {
  switch (template) {
    case "restaurant_menu":
      return restaurantContent();
    case "service_catalog":
      return serviceCatalogContent();
    case "lead_funnel":
      return leadFunnelContent();
  }
}

/** Slug amigable a partir de cualquier texto. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Etiqueta legible de una plantilla. */
export function templateLabel(template: SiteVerticalTemplate): string {
  return SITE_TEMPLATE_LABELS[template];
}
