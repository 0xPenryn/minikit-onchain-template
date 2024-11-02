"use client";
import {
  MiniKit,
  ResponseEvent,
  VerificationLevel,
  MiniAppVerifyActionPayload,
  MiniAppVerifyActionSuccessPayload,
  MiniAppSendTransactionPayload,
} from "@worldcoin/minikit-js";
import { useEffect, useState } from "react";
import abi from "../../abi/ContractAbi.json";
import { parseAbiParameters, decodeAbiParameters } from "viem";

export type VerifyCommandInput = {
  action: string;
  signal?: string;
  verification_level?: VerificationLevel; // Default: Orb
};

const triggerVerify = (data: VerifyCommandInput) => {
  MiniKit.commands.verify(data);
};

const triggerTransaction = (
  response: MiniAppVerifyActionSuccessPayload
) => {
  MiniKit.commands.sendTransaction({
    transaction: [
      {
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        abi: abi,
        functionName: "verifyAndExecute",
        args: [
          MiniKit.user?.walletAddress,
          response.merkle_root,
          response.nullifier_hash,
          decodeAbiParameters(
						parseAbiParameters('uint256[8]'),
						response.proof as `0x${string}`
					)[0].map((value) => value.toString()),
        ],
      },
    ],
  });
};

export const VerifyBlock = () => {
  const [worldIdProof, setWorldIdProof] =
    useState<MiniAppVerifyActionSuccessPayload | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");
  const [verifyPayload, setVerifyPayload] = useState<VerifyCommandInput | null>(null);

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

    setVerifyPayload({
      action: process.env.NEXT_PUBLIC_ACTION_ID as string,
      signal: MiniKit.user?.walletAddress as string,
      verification_level: VerificationLevel.Orb,
    });

    MiniKit.subscribe(
      ResponseEvent.MiniAppVerifyAction,
      async (response: MiniAppVerifyActionPayload) => {
        if (response.status === "error") {
          return console.log("Error payload", response);
        }
        setWorldIdProof(response);
      }
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction);
    };
  }, []);

  useEffect(() => {
    if (!MiniKit.isInstalled() || !worldIdProof) {
      return;
    }

    MiniKit.subscribe(
      ResponseEvent.MiniAppSendTransaction,
      async (payload: MiniAppSendTransactionPayload) => {
        if (payload.status === "error") {
          console.error("Error sending transaction", payload);
        } else {
          console.log("txId: ", payload.transaction_id);
          setTransactionId(payload.transaction_id);
        }
      }
    );

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSendTransaction);
    };
  }, [worldIdProof]);

  return (
    <>
      {!worldIdProof ? (
        <div>
          <button className="bg-green-500 p-4" onClick={() => triggerVerify(verifyPayload!)}>
            Verify
          </button>
        </div>
      ) : transactionId ? (
        <div>
          <a
            className="bg-green-500 p-4"
            href={`https://worldscan.org/tx/${transactionId}`}
            target="_blank"
          >
            View on Worldscan
          </a>
        </div>
      ) : (
        <div>
          <button
            className="bg-green-500 p-4"
            onClick={() => triggerTransaction(worldIdProof)}
          >
            Send Transaction
          </button>
        </div>
      )}
    </>
  );
};
