import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "../../../lib/stripe";

export async function POST() {
  try {
    const headersList = await headers();
    const origin = headersList.get("origin");

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, price_1234) of the product you want to sell
          price: "price_1RbLOfR5sETaZz4ttvsJsFS1",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.redirect(session.url, 303);
  } catch (err: unknown) {
    let message = "An error occurred";
    let statusCode = 500;
    if (err && typeof err === "object" && "message" in err) {
      message = (err as { message: string }).message;
    }
    if (err && typeof err === "object" && "statusCode" in err) {
      statusCode = (err as { statusCode: number }).statusCode;
    }
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
