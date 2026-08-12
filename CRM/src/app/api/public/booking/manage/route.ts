import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  }

  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const { data, error } = await sb
      .from("bookings")
      .select("*, calendars(name), organizations(name)")
      .eq("token", token)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const calendarName = (data as unknown as { calendars?: { name?: string } | null }).calendars?.name ?? null;
    const orgName = (data as unknown as { organizations?: { name?: string } | null }).organizations?.name ?? "";

    return NextResponse.json({
      booking: { ...data, calendar_name: calendarName, org_name: orgName },
    });
  } catch (err) {
    console.error("Fetch booking by token error:", err);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}