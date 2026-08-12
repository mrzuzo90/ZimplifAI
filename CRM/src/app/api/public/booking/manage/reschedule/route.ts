import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest) {
  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { token, date, time } = body;

    if (!token || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bookingDate = new Date(`${date}T${time}:00`).toISOString();

    const { data, error } = await sb
      .from("bookings")
      .update({ booking_date: bookingDate, status: "confirmed" })
      .eq("token", token)
      .in("status", ["pending", "confirmed"])
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Booking not found or not eligible for reschedule" }, { status: 404 });
    }

    return NextResponse.json({ booking: data });
  } catch (err) {
    console.error("Reschedule booking error:", err);
    return NextResponse.json({ error: "Failed to reschedule booking" }, { status: 500 });
  }
}