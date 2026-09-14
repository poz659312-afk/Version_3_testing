import { getServerStudentSession } from "@/lib/auth-server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRateLimit, getRequestIdentifier, RateLimitTier } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"

// Hardcoded store items
const STORE_ITEMS = [
  { id: "badge-quiz-master", name: "Quiz Master Badge", price: 500, type: "badge" },
  { id: "badge-speed-demon", name: "Speed Demon Badge", price: 300, type: "badge" },
  { id: "badge-pro-solver", name: "Pro Solver Badge", price: 1000, type: "badge" },
  { id: "theme-diamond", name: "Diamond Theme", price: 1500, type: "theme" },
  { id: "theme-luxury", name: "Luxury Velvet Theme", price: 1500, type: "theme" },
  { id: "theme-cyberpunk", name: "Cyberpunk Theme", price: 1500, type: "theme" },
  { id: "theme-matrix", name: "Matrix Theme", price: 3000, type: "theme" },
  { id: "theme-nebula", name: "Nebula Theme", price: 1500, type: "theme" },
  { id: "theme-glacier", name: "Glacier Theme", price: 3000, type: "theme" },
  { id: "theme-solaris", name: "Solaris Supernova Theme", price: 10000, type: "theme" },
  // Borders
  { id: "border-gold-glow", name: "Gold Glow Border", price: 600, type: "border" },
  { id: "border-cosmic-aurora", name: "Cosmic Aurora Border", price: 900, type: "border" },
  { id: "border-neon-glitch", name: "Cyber Neon Border", price: 750, type: "border" },
  // Cursors
  { id: "cursor-sparkles", name: "Cosmic Sparkles Cursor", price: 450, type: "cursor" },
  { id: "cursor-cyber-cross", name: "Cyber Cross Cursor", price: 600, type: "cursor" },
  { id: "cursor-bubbles", name: "Bouncing Bubbles Cursor", price: 750, type: "cursor" },
]

export async function POST(request: NextRequest) {
  try {
    const identifier = getRequestIdentifier(request)
    const rateLimit = checkRateLimit(identifier, RateLimitTier.WRITE)
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: "Too many purchase attempts. Please slow down." },
        { status: 429 }
      )
    }

    // 1. Authenticate caller server-side
    const session = await getServerStudentSession()
    if (!session || !session.auth_id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to make purchases." },
        { status: 401 }
      )
    }

    if (session.is_banned) {
      return NextResponse.json(
        { success: false, error: "Your account is restricted from making purchases." },
        { status: 403 }
      )
    }

    const { itemId } = await request.json()

    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json({ success: false, error: "Invalid item ID" }, { status: 400 })
    }

    const item = STORE_ITEMS.find((i) => i.id === itemId)
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found in store" }, { status: 404 })
    }

    const supabase = createAdminClient()

    // 2. Fetch fresh user data using verified server session.auth_id
    const { data: user, error: userError } = await (supabase
      .from("chameleons") as any)
      .select("coins, inventory")
      .eq("auth_id", session.auth_id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "User account not found" }, { status: 404 })
    }

    const currentCoins = Number(user.coins) || 0
    const inventory = Array.isArray(user.inventory) ? user.inventory : []

    // 3. Verify item is not already owned
    if (inventory.includes(itemId)) {
      return NextResponse.json({ success: false, error: "Item already in your inventory" }, { status: 400 })
    }

    // 4. Verify balance
    if (currentCoins < item.price) {
      return NextResponse.json(
        { success: false, error: `Insufficient Chameleon Coins. You need ${item.price} coins.` },
        { status: 400 }
      )
    }

    const newCoins = currentCoins - item.price
    const newInventory = [...inventory, itemId]

    // 5. Atomic conditional update: only succeed if balance is still >= item.price
    const { data: updateData, error: updateError } = await (supabase
      .from("chameleons") as any)
      .update({
        coins: newCoins,
        inventory: newInventory
      })
      .eq("auth_id", session.auth_id)
      .gte("coins", item.price)
      .select("coins")

    if (updateError || !updateData || updateData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Transaction could not be completed. Balance may have changed." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        newBalance: newCoins,
        itemId: itemId
      }
    })

  } catch (error: any) {
    console.error("Store Purchase Error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic';
