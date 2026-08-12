import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest) {
  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Service role not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const { data, error } = await sb
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("token", token)
      .in("status", ["pending", "confirmed"])
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Booking not found or already cancelled" }, { status: 404 });
    }

    return NextResponse.json({ booking: data });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}