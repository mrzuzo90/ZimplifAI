import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  message?: unknown;
  website?: unknown;
};

/**
 * Formulario de contacto → Resend (sin servidor propio).
 * Validación robusta, mensajes en español y fallo controlado:
 * nunca rompe la página, siempre devuelve JSON legible para el cliente.
 */
export async function POST(req: Request) {
  let payload: ContactPayload;
  try {
    payload = (await req.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ ok: false, message: "Datos inválidos." }, { status: 400 });
  }

  // Honeypot anti-bots: si está relleno, responder OK pero ignorar.
  if (typeof payload.website === "string" && payload.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const company = typeof payload.company === "string" ? payload.company.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, message: "Faltan campos obligatorios (nombre, email, mensaje)." },
      { status: 400 },
    );
  }
  if (name.length < 2 || message.length < 10) {
    return NextResponse.json(
      { ok: false, message: "El nombre o el mensaje son demasiado cortos." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, message: "El email no tiene un formato válido." },
      { status: 400 },
    );
  }
  if (name.length > 120 || message.length > 5000 || company.length > 200) {
    return NextResponse.json(
      { ok: false, message: "Alguno de los campos es demasiado largo." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  if (!apiKey || !to) {
    // Estado conocido: el cliente muestra "no configurado" con un fallback elegante.
    return NextResponse.json(
      { ok: false, message: "El formulario no está configurado todavía." },
      { status: 503 },
    );
  }

  const from = process.env.RESEND_FROM || "ZimplifAI Web <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Nuevo contacto web · ${name}${company ? ` · ${company}` : ""}`,
        reply_to: email,
        text: [
          `Nombre: ${name}`,
          `Email: ${email}`,
          `Empresa: ${company || "—"}`,
          "",
          "Mensaje:",
          message,
        ].join("\n"),
      }),
    });

    if (!res.ok) {
      console.error("Resend error:", res.status, await res.text().catch(() => ""));
      return NextResponse.json(
        { ok: false, message: "El servicio de email falló. Inténtalo en unos minutos." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json(
      { ok: false, message: "Error interno del servidor. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
