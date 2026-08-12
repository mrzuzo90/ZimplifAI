import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { buildDaySlots, type DaySlot } from "@/lib/booking";
import type { AvailabilityRule, Booking } from "@/types/database";

export async function GET(request: NextRequest) {
  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");
  const calendarId = searchParams.get("calendar_id");
  const date = searchParams.get("date");

  if (!orgId || !calendarId || !date) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();

    const [calendarRes, rulesRes, bookingsRes] = await Promise.all([
      sb.from("calendars").select("*").eq("id", calendarId).maybeSingle(),
      sb
        .from("availability_rules")
        .select("*")
        .eq("organization_id", orgId)
        .eq("calendar_id", calendarId)
        .eq("is_active", true),
      sb
        .from("bookings")
        .select("*")
        .eq("organization_id", orgId)
        .eq("calendar_id", calendarId)
        .not("status", "eq", "cancelled"),
    ]);

    if (rulesRes.error) throw rulesRes.error;

    const calendar = calendarRes.data;
    const rules = (rulesRes.data ?? []) as AvailabilityRule[];
    const allBookings = (bookingsRes.data ?? []) as Booking[];

    const duration = (calendar?.service_duration_min ?? 60) as number;
    const slotMinutes = (calendar?.settings?.slot_minutes ?? 30) as number;

    const dayBookings = allBookings.filter(
      (b) => new Date(b.booking_date).toISOString().slice(0, 10) === date
    );

    const slots = buildDaySlots({
      rules,
      dayOfWeek,
      bookings: dayBookings,
      durationMin: duration,
      slotMinutes,
    });

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Availability fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}