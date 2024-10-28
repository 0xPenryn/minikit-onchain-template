"use client";
import { MiniKit, ResponseEvent } from "@worldcoin/minikit-js";
import { useEffect, useState } from "react";

export const ConnectWalletBlock = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string>("");

  const signInWithWallet = async () => {
    const res = await fetch(`/api/nonce`);
    setNonce((await res.json()).nonce);

    MiniKit.commands.walletAuth({
      nonce: nonce,
      expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
      statement: "Connect your wallet to the MiniKit Onchain Template",
    });
  };

  const getUsername = async (address: string) => {
    const res = await fetch("https://usernames.worldcoin.org/api/v1/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        addresses: [address],
      }),
    });

    const data = await res.json();
    return data.usernames[0] ?? { username: null, profilePictureUrl: null };
  };

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    MiniKit.subscribe(ResponseEvent.MiniAppWalletAuth, async (payload) => {
      if (payload.status === "error") {
        return;
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

        setAddress(payload.address);
        setUsername((await getUsername(payload.address)).username);
      }
    });

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppWalletAuth);
    };
  }, [nonce]);

  return (
    <>
      {address ? (
        <div>
          <h1>Verify Block</h1>
          <button className="bg-green-500 p-4">
            {username ?? address}
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
