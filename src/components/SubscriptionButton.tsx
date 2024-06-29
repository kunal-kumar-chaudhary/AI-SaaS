"use client";
import React from "react";
import { useState } from "react";
import { Button } from "./ui/button";
import axios from "axios";

type Props = {
  isPro: boolean;
};
const SubscriptionButton = (props: Props) => {
  const [loading, setLoading] = useState(false);
  const handleSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/stripe");
      window.location.href = response.data.url;
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <Button disabled={loading} onClick={handleSubscription}>
        {props.isPro ? "Manage Subscriptions" : "Get Pro"}
      </Button>
    </div>
  );
};

export default SubscriptionButton;
