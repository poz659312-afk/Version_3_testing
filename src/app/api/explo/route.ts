import { POST as marlinePost } from "../marline/route";

export async function POST(req: Request) {
  return marlinePost(req);
}

export const dynamic = 'force-dynamic';
