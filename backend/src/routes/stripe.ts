import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { PREMIUM_PRICE } from "../lib/constants";

const router = Router();

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

router.post("/checkout", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "HealMind Premium",
              description: "Unlimited AI chats, premium exercises, and advanced insights",
            },
            unit_amount: Math.round(PREMIUM_PRICE * 100),
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      metadata: { userId },
      success_url: `${process.env.FRONTEND_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    });

    return res.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const signature = req.headers["stripe-signature"]!;

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              isPremium: true,
              stripeCustomerId: session.customer as string,
              subscriptionId: session.subscription as string,
            },
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { isPremium: false, subscriptionId: null, subscriptionEnd: new Date() },
        });
        break;
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
});

export default router;
