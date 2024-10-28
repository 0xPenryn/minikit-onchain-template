"use client";
import {
  MiniKit,
  ResponseEvent
} from "@worldcoin/minikit-js";
import { useEffect } from "react";

export const ConnectWalletBlock = () => {
  var nonce: string = "";

  const signInWithWallet = async () => {
    const res = await fetch(`/api/nonce`);
    nonce = (await res.json()).nonce;

    const generateMessageResult = MiniKit.commands.walletAuth({
      nonce: nonce,
      expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      statement:
        "Connect your wallet to the MiniKit Onchain Template",
    });
  };

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(ResponseEvent.MiniAppWalletAuth, async (payload) => {
      if (payload.status === "error") {
        return
      } else {
        const response = await fetch("/api/complete-siwe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: payload,
            nonce,
          }),
        });
      }
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppWalletAuth);
    };
  }, [nonce]);

  return (
    <div>
      <h1>Verify Block</h1>
      <button className="bg-green-500 p-4" onClick={signInWithWallet}>
        Connect Wallet
      </button>
    </div>
  );
};
