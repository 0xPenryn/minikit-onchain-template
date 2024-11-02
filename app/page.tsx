import { ConnectWalletBlock } from "@/components/ConnectWallet";
// import { PayBlock } from "@/components/Pay";
import { VerifyBlock } from "@/components/Verify";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-y-3">
      <ConnectWalletBlock />
      {/* <VerifyBlock /> */}
      {/* <PayBlock /> */}
    </main>
  );
}
