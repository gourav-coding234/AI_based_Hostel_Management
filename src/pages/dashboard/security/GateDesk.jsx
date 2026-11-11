import GateScan from "./GateScan";
import InOutRegister from "./InOutRegister";

/** Combined security workflow: verify first, then manage the live register. */
export default function GateDesk() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <GateScan />
      <InOutRegister />
    </div>
  );
}
