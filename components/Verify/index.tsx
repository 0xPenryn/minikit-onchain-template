"use client";
import {
  MiniKit,
  ResponseEvent,
  VerificationLevel,
  MiniAppVerifyActionPayload,
  ISuccessResult,
  MiniAppVerifyActionSuccessPayload,
  MiniAppSendTransactionPayload,
} from "@worldcoin/minikit-js";
import { useEffect, useState } from "react";
import abi from "../../abi/ContractAbi.json";
import { useWaitForTransactionReceipt } from "@worldcoin/minikit-react";
import { Abi, createPublicClient, http, hexToBigInt, parseAbiParameters, decodeAbiParameters } from "viem";
import { worldchain } from "viem/chains";

export type VerifyCommandInput = {
  action: string;
  signal?: string;
  verification_level?: VerificationLevel; // Default: Orb
};

const verifyPayload: VerifyCommandInput = {
  action: process.env.NEXT_PUBLIC_ACTION_ID as string,
  signal: MiniKit.user?.walletAddress as string,
  verification_level: VerificationLevel.Orb,
};

const triggerVerify = () => {
  MiniKit.commands.verify(verifyPayload);
};

const triggerTransaction = async (
  response: MiniAppVerifyActionSuccessPayload
) => {
  console.log(
    "debug: ",
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    MiniKit.user?.walletAddress,
    response,
    abi
  );
  await MiniKit.commandsAsync.sendTransaction({
    transaction: [
      {
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
        abi: abi,
        // abi:   [{
        //   "type": "function",
        //   "name": "verifyAndExecute",
        //   "inputs": [
        //     {
        //       "name": "signal",
        //       "type": "address",
        //       "internalType": "address"
        //     },
        //     {
        //       "name": "root",
        //       "type": "uint256",
        //       "internalType": "uint256"
        //     },
        //     {
        //       "name": "nullifierHash",
        //       "type": "uint256",
        //       "internalType": "uint256"
        //     },
        //     {
        //       "name": "proof",
        //       "type": "uint256[8]",
        //       "internalType": "uint256[8]"
        //     }
        //   ],
        //   "outputs": [],
        //   "stateMutability": "nonpayable"
        // }],
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

  console.log("transaction sent");
};

const client = createPublicClient({
  chain: worldchain,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
});

export const VerifyBlock = () => {
  const [worldIdProof, setWorldIdProof] =
    useState<MiniAppVerifyActionSuccessPayload | null>(null);
  const [transactionId, setTransactionId] = useState<string>("");

  useEffect(() => {
    if (!MiniKit.isInstalled()) {
      return;
    }

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

    // triggerTransaction(worldIdProof);

    console.log("world id proof useEffectdebug: ", worldIdProof);

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

    console.log("subscribed to send transaction");

    return () => {
      MiniKit.unsubscribe(ResponseEvent.MiniAppSendTransaction);
    };
  }, [worldIdProof]);

  return (
    <>
      {!worldIdProof ? (
        <div>
          <button className="bg-green-500 p-4" onClick={triggerVerify}>
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
