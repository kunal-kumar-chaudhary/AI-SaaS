import {headers} from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { userSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
export async function POST(req: Request){
    const body = await req.json();
    // we need to validate whether the hook is coming from the stripe
    const signature = headers().get("stripe-signature") as string;
    let event: Stripe.Event;

    try{
        // verifying the authenticity of the incoming webhook from stripe
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
    }
    catch(e){
        return new Response("Webhook error", {status: 400});
    }

    const session = event.data.object as Stripe.Checkout.Session;

    // if the new subscription is successful, we will save it to database
    if (event.type === "checkout.session.completed") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        if (!session?.metadata?.userId){
            return new Response("User not found", {status: 404});
        }
        // if everthing is fine, we will save the subscription to the database
        await db.insert(userSubscriptions).values({
            userId: session.metadata.userId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        });
    }

    if (event.type === "invoice.payment_succeeded"){
        // if the payment is successful, we will update the subscription
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        if (!session?.metadata?.userId){
            return new Response("User not found", {status: 404});
        }
        await db.update(userSubscriptions).set({
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        }).where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
    }

    return NextResponse.json(null, {status: 200})
}