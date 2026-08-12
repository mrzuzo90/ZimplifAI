import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { uuid } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { orgId, calendar_id, first_name, last_name, phone, email, party_size, date, time } = body;

    if (!orgId || !calendar_id || !first_name || !phone || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bookingDate = new Date(`${date}T${time}:00`).toISOString();
    const party = party_size > 1 ? `${party_size} personas` : "1 persona";

    // 1) Lead (dedupe por teléfono dentro del tenant)
    let leadId: string | null = null;

    const { data: existing } = await sb
      .from("leads")
      .select("id")
      .eq("organization_id", orgId)
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      leadId = existing.id as string;
    } else {
      const { data: lead, error: leadError } = await sb
        .from("leads")
        .insert({
          organization_id: orgId,
          first_name,
          last_name: last_name ?? null,
          phone,
          email: email ?? null,
          status: "booked",
          tags: ["Web"],
          deal_value: null,
        })
        .select("id")
        .single();
      if (leadError) throw leadError;
      leadId = lead.id as string;
    }

    // 2) Reserva con token + source público
    const token = `bk_${uuid()}`;
    const { data: booking, error: bookingError } = await sb
      .from("bookings")
      .insert({
        organization_id: orgId,
        lead_id: leadId,
        calendar_id,
        booking_date: bookingDate,
        party_size_or_service: party,
        status: "confirmed",
        notes: "Reserva online",
        source: "public",
        token,
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 3) Registro de actividad (coincide con schema: summary, metadata)
    await sb.from("lead_activity").insert({
      id: uuid(),
      organization_id: orgId,
      lead_id: leadId,
      event_type: "booking_confirmed",
      summary: `Reserva confirmada online para ${party} el ${date} a las ${time}`,
      metadata: { booking_id: booking.id, party_size: party },
    });

    return NextResponse.json({ booking, token });
  } catch (err) {
    console.error("Public booking error:", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}