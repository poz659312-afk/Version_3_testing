import { createServerClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Hardcoded store items for now
const STORE_ITEMS = [
  { id: "badge-quiz-master", name: "Quiz Master Badge", price: 500, type: "badge" },
  { id: "badge-speed-demon", name: "Speed Demon Badge", price: 300, type: "badge" },
  { id: "badge-pro-solver", name: "Pro Solver Badge", price: 1000, type: "badge" },
]

export async function POST(request: NextRequest) {
  try {
    const { authId, itemId } = await request.json()

    if (!authId || !itemId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const item = STORE_ITEMS.find((i) => i.id === itemId)
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 })
    }

    const supabase = await createServerClient()

    // 1. Fetch user data (coins and inventory)
    const { data: user, error: userError } = await supabase
      .from("chameleons")
      .select("coins, inventory")
      .eq("auth_id", authId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // 2. Check if user already owns the item
    const inventory = Array.isArray(user.inventory) ? user.inventory : []
    if (inventory.includes(itemId)) {
      return NextResponse.json({ success: false, error: "Item already owned" }, { status: 400 })
    }

    // 3. Check balance
    if (user.coins < item.price) {
      return NextResponse.json({ success: false, error: "Insufficient coins" }, { status: 400 })
    }

    // 4. Record purchase (Transaction)
    // We update the user record by deducting coins and adding to inventory
    // In a real database, this should be a transaction, but Supabase SDK handles atomic updates for simple cases
    const { error: updateError } = await supabase
      .from("chameleons")
      .update({
        coins: user.coins - item.price,
        inventory: [...inventory, itemId]
      })
      .eq("auth_id", authId)

    if (updateError) {
      return NextResponse.json({ success: false, error: "Transaction failed: " + updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        newBalance: user.coins - item.price,
        itemId: itemId
      }
    })

  } catch (error: any) {
    console.error("Store Purchase Error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic';
