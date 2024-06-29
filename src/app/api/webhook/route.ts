import {headers} from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
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
        if (!session.metadata.userId){

        }
    }
}