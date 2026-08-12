import { NextRequest } from "next/server"
import { GET as resetGET, POST as resetPOST } from "../reset-ai-credits/route"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  return resetGET(request)
}

export async function POST(request: NextRequest) {
  return resetPOST(request)
}
