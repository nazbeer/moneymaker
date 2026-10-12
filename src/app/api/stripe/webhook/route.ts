import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma, timestamp, withDates } from "@/lib/prisma";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
          await prisma.orm.public.User
            .where({ id: userId })
            .update({ isPremium: true, stripeCustomerId: session.customer as string, subscriptionId: session.subscription as string })
            .then((row) => { if (!row) throw new Error("Record not found for update"); return row; })
            .then(withDates);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await prisma.orm.public.User
          .where({ stripeCustomerId: customerId })
          .updateAndCount({ isPremium: false, subscriptionId: null, subscriptionEnd: timestamp(new Date()) });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
