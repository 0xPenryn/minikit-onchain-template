"use client";
import { MiniKit, ResponseEvent } from "@worldcoin/minikit-js";
import { useEffect, useState } from "react";
import { VerifyBlock } from "../Verify";

export const ConnectWalletBlock = () => {
  const [nonce, setNonce] = useState<string>("");

  const signInWithWallet = async () => {
    const res = await fetch(`/api/nonce`);
    const body = await res.json();
    setNonce(body.nonce);

    MiniKit.commands.walletAuth({
      nonce: body.nonce,
      expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      statement: "Connect your wallet to the MiniKit Onchain Template",
    });
  };

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(ResponseEvent.MiniAppWalletAuth, async (payload) => {
      if (payload.status === "error") {
        console.error(payload);
        return;
      } else {
        const response = await fetch("/api/verify-wallet", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: payload,
            nonce,
          }),
        });
        console.log(await response.json());
      }
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppWalletAuth);
    };
  }, [nonce]);

  return (
    <>
      {MiniKit.user ? (
        <>
          <div>
            <button className="bg-green-500 p-4">
              Signed in as {MiniKit.user.username ?? MiniKit.user.walletAddress}
            </button>
          </div>
          <VerifyBlock />
        </>
      ) : (
        <div>
          <button className="bg-green-500 p-4" onClick={signInWithWallet}>
            Connect Wallet
          </button>
        </div>
      )}
    </>
  );
};
