import { NextRequest, NextResponse } from "next/server";

let latestIntake: { id: number; timestamp: number } | null = null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  latestIntake = { id: body.intake_id, timestamp: Date.now() };
  console.log("Intake notify received:", body.intake_id);
  return NextResponse.json(
    { success: true, intake_id: body.intake_id },
    { headers: corsHeaders }
  );
}

export async function GET() {
  if (!latestIntake) {
    return NextResponse.json({ intake_id: null }, { headers: corsHeaders });
  }
  const result = latestIntake;
  latestIntake = null;
  return NextResponse.json({ intake_id: result.id }, { headers: corsHeaders });
}