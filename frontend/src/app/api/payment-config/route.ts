import { NextResponse } from "next/server";

// Read the WhatsApp numbers from server env at request time so they can be
// changed via .env + container restart without rebuilding the frontend image.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    vodafoneNumber: process.env.WHATSAPP_VODAFONE_NUMBER ?? "",
    instapayNumber: process.env.WHATSAPP_INSTAPAY_NUMBER ?? "",
  });
}
