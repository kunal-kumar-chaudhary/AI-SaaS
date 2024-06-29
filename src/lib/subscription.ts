import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { userSubscriptions } from "./db/schema";
import { eq } from "drizzle-orm";

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const checkSubscription = async () => {
  // check if the user has an active subscription
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  // checks if the userSubscriptions table has a record with the userId
  const _userSubscriptions = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.userId, userId));

  // if the current signed in user has not subscribed yet
  if (!_userSubscriptions[0]) {
    return false;
  }

  // if there is a subscription, return the subscription details
  const userSubscription = _userSubscriptions[0];

  const isValid =
    userSubscription.stripePriceId &&
    userSubscription.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS >
      Date.now();

    return !!isValid;
};
