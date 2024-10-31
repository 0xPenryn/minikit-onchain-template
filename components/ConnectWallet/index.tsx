"use client";
import { MiniKit, ResponseEvent } from "@worldcoin/minikit-js";
import { useEffect, useState } from "react";

export const ConnectWalletBlock = () => {
  const [nonce, setNonce] = useState<string>("");

  const signInWithWallet = async () => {
    const res = await fetch(`/api/nonce`);
    const json = await res.json();
    console.log("nonce endpoint response: ", json);
    setNonce(json.nonce);

    console.log("nonce: ", nonce);
    console.log("json.nonce: ", json.nonce);

    console.log("sending walletAuth command with nonce: ", nonce);

    MiniKit.commands.walletAuth({
      nonce,
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
        <div>
          <h1>Verify Block</h1>
          <button className="bg-green-500 p-4">
            Signed in as {MiniKit.user.username ?? MiniKit.user.walletAddress}
          </button>
        </div>
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
