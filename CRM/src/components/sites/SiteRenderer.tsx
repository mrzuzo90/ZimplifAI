"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CalendarCheck, Check, Clock, FileText, Loader2, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SITE_TEMPLATE_LABELS, type TenantSite } from "@/types/database";

interface SiteLeadForm {
  first_name: string;
  phone: string;
  email?: string;
  message?: string;
}

interface Props {
  site: TenantSite;
  brandColor?: string;
  brandLogo?: string | null;
  /** Si se pasa, el CTA de reserva/contacto envía el lead (página pública). */
  onLeadSubmit?: (form: SiteLeadForm) => Promise<void>;
  /** Ruta del calendario de reservas (Fase C) o null → modal de lead. */
  bookingUrl?: string | null;
}

/** Renderiza un micro-website vertical (vista previa en editor + página pública). */
export function SiteRenderer({ site, brandColor = "#CEFF00", brandLogo = null, onLeadSubmit, bookingUrl = null }: Props) {
  const c = site.content_payload;
  const primary = brandColor || "#CEFF00";
  const isRestaurant = site.vertical_template === "restaurant_menu";
  const isLead = site.vertical_template === "lead_funnel";

  const [bookingOpen, setBookingOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState<SiteLeadForm>({ first_name: "", phone: "" });

  const openBooking = () => {
    if (bookingUrl) {
      window.open(bookingUrl, "_blank", "noopener");
      return;
    }
    setBookingOpen(true);
  };

  const submit = async () => {
    if (!form.first_name.trim() || !form.phone.trim()) {
      toast.error("Completa tu nombre y teléfono para continuar");
      return;
    }
    setSubmitting(true);
    try {
      if (onLeadSubmit) {
        await onLeadSubmit(form);
      }
      setDone(true);
    } catch {
      toast.error("No se pudo enviar la solicitud. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const categories = Array.from(new Set(c.menu_items.map((m) => m.category)));
  const groups = categories.map((cat) => ({
    cat,
    items: c.menu_items.filter((m) => m.category === cat),
  }));

  return (
    <div className="min-h-full bg-[#fafaf7] text-[#141815] antialiased">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {c.hero.bg_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.hero.bg_image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(1200px 600px at 70% -10%, ${primary}22, transparent 60%), linear-gradient(135deg, #0d1a12 0%, #0b0d0c 100%)`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d0c]/95 via-[#0b0d0c]/70 to-[#0b0d0c]/40" />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-5 py-16 text-center sm:py-20">
          {brandLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brandLogo} alt={site.title} className="mb-5 h-14 w-14 rounded-xl bg-white object-contain" />
          ) : (
            <span
              className="mb-5 grid h-14 w-14 place-items-center rounded-xl text-lg font-black"
              style={{ backgroundColor: primary, color: "#0b0d0c" }}
            >
              {site.title.slice(0, 1).toUpperCase()}
            </span>
          )}
          {c.hero.badge && (
            <span
              className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${primary}1a`, color: primary }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: primary }} />
              {c.hero.badge}
            </span>
          )}
          <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            {c.hero.headline}
          </h1>
          {c.hero.subheadline && (
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80">{c.hero.subheadline}</p>
          )}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={openBooking}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-[#0b0d0c] shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
              style={{ backgroundColor: primary }}
            >
              {bookingUrl ? <CalendarCheck className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              {c.hero.cta_text}
            </button>
            {!isLead && c.contact.phone && (
              <a
                href={`tel:${c.contact.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                {c.contact.phone}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Menú / Servicios */}
      {c.sections.show_menu && groups.length > 0 && (
        <section className="mx-auto max-w-3xl px-5 py-12">
          <h2 className="font-display text-center text-2xl font-bold text-[#141815]">
            {isRestaurant ? "Nuestra Carta" : isLead ? "Cómo trabajamos" : "Nuestros Servicios"}
          </h2>
          <div className="mt-2 h-1 w-12 rounded-full mx-auto" style={{ backgroundColor: primary }} />

          <div className="mt-8 space-y-8">
            {groups.map(({ cat, items }) => (
              <div key={cat}>
                <h3 className="mb-3 border-b-2 border-[#e8e8e2] pb-1 font-display text-lg font-bold uppercase tracking-wide text-[#3c463f]">
                  {cat}
                </h3>
                <div className="divide-y divide-[#e8e8e2]">
                  {items.map((item, i) => (
                    <div key={`${item.name}-${i}`} className="flex items-start gap-3 py-3">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.name} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span
                          className="grid h-16 w-16 shrink-0 place-items-center rounded-lg font-black"
                          style={{ backgroundColor: `${primary}14`, color: primary }}
                        >
                          {item.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-semibold text-[#141815]">{item.name}</p>
                          <span className="shrink-0 font-bold" style={{ color: isRestaurant ? primary : "#141815" }}>
                            {isRestaurant && item.price > 0 ? "€" : "Desde €"}
                            {item.price.toFixed(2).replace(/\.00$/, "")}
                          </span>
                        </div>
                        {item.description && <p className="mt-0.5 text-sm text-[#5c665e]">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {c.menu_pdf_url && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setPdfOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[#141815]/5"
                style={{ borderColor: primary, color: "#141815" }}
              >
                <FileText className="h-4 w-4" />
                Ver carta
              </button>
            </div>
          )}
        </section>
      )}

      {/* Horario */}
      {c.sections.show_hours && c.business_hours.length > 0 && (
        <section className="border-y border-[#e8e8e2] bg-[#f2f2ec]">
          <div className="mx-auto max-w-3xl px-5 py-10">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" style={{ color: primary }} />
              <h2 className="font-display text-lg font-bold text-[#141815]">Horario</h2>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {c.business_hours.map((h) => (
                <div key={h.day} className="flex items-center justify-between gap-3 rounded-lg border border-[#e2e6dd] bg-white px-4 py-3">
                  <span className="text-sm font-semibold text-[#141815]">{h.day}</span>
                  <span className="text-right text-sm text-[#5c665e]">{h.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA reserva / contacto */}
      {c.sections.show_booking && (
        <section className="mx-auto max-w-3xl px-5 py-14 text-center">
          <h2 className="font-display text-2xl font-bold text-[#141815]">
            {isRestaurant ? "¿Listo para reservar?" : "Empieza hoy"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#5c665e]">
            {isRestaurant
              ? "Elige día y hora, y confirma tu mesa en menos de un minuto."
              : "Déjanos tus datos y te contactamos en menos de 1 hora."}
          </p>
          <Button
            onClick={openBooking}
            className="mt-5 h-11 rounded-full px-7 text-sm font-bold"
            style={{ backgroundColor: primary, color: "#0b0d0c" }}
          >
            {bookingUrl ? <CalendarCheck className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {c.hero.cta_text}
          </Button>
        </section>
      )}

      {/* Ubicación / contacto */}
      {c.sections.show_location && c.contact.address && (
        <footer className="border-t border-[#e8e8e2] bg-[#0b0d0c]">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-5 py-10 text-center">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4" style={{ color: primary }} />
              <span className="text-sm font-medium">{c.contact.address}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/70">
              {c.contact.phone && (
                <a className="inline-flex items-center gap-1.5 hover:text-white" href={`tel:${c.contact.phone.replace(/\s/g, "")}`}>
                  <Phone className="h-3.5 w-3.5" /> {c.contact.phone}
                </a>
              )}
              {c.contact.google_maps_url && (
                <a
                  className="inline-flex items-center gap-1.5 hover:text-white"
                  href={c.contact.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="h-3.5 w-3.5" /> Cómo llegar
                </a>
              )}
            </div>
            <p className="mt-3 text-[11px] text-white/40">
              © {new Date().getFullYear()} {site.title} · {SITE_TEMPLATE_LABELS[site.vertical_template]}
            </p>
          </div>
        </footer>
      )}

      {/* Botón flotante de WhatsApp */}
      {c.contact.whatsapp && (
        <a
          href={`https://wa.me/${c.contact.whatsapp.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-110"
          aria-label="Escribir por WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
      )}

      {/* Modal de reserva / contacto */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-md">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full" style={{ backgroundColor: `${primary}1a` }}>
                <Check className="h-6 w-6" style={{ color: primary }} />
              </span>
              <DialogTitle>¡Solicitud enviada!</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Te confirmaremos por WhatsApp en unos minutos. ¡Gracias!
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{isRestaurant ? "Reservar mesa" : "Solicitar contacto"}</DialogTitle>
                <DialogDescription>
                  Déjanos tus datos y te responderemos enseguida.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                  <Input
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+34 600 000 000"
                    type="tel"
                  />
                </div>
                {!isRestaurant && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Email (opcional)</label>
                    <Input
                      value={form.email ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="tu@email.com"
                      type="email"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {isRestaurant ? "Comensales o detalles (opcional)" : "¿Qué necesitas? (opcional)"}
                  </label>
                  <Textarea
                    value={form.message ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="min-h-16 resize-none text-sm"
                    placeholder={isRestaurant ? "Ej. 4 personas, sábado 20:30" : "Cuéntanos tu caso…"}
                  />
                </div>
                <Button
                  onClick={() => void submit()}
                  disabled={submitting}
                  className="w-full"
                  style={{ backgroundColor: primary, color: "#0b0d0c" }}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {isRestaurant ? "Confirmar reserva" : "Enviar solicitud"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de carta / menú PDF */}
      {c.menu_pdf_url && (
        <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
          <DialogContent className="max-w-3xl gap-0 p-0">
            <DialogHeader className="border-b border-[#e8e8e2] px-5 py-4">
              <DialogTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" style={{ color: primary }} />
                Carta de {site.title}
              </DialogTitle>
            </DialogHeader>
            <div className="bg-[#f2f2ec]">
              <iframe
                src={c.menu_pdf_url}
                title={`Carta de ${site.title}`}
                className="h-[65vh] w-full border-0"
              />
            </div>
            <div className="flex items-center justify-between border-t border-[#e8e8e2] px-5 py-3">
              <p className="text-xs text-[#5c665e]">Si no se ve correctamente, abre el PDF directamente.</p>
              <a
                href={c.menu_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors hover:bg-[#141815]/5"
                style={{ color: primary }}
              >
                Abrir en nueva pestaña ↗
              </a>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export type { SiteLeadForm };
