import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useAuth } from "../../../context/AuthContext";
import { Card, Pill, Button, Field, inputCls, EmptyState } from "../../../components/dashboard/student/ui";
import { ScanIcon, CameraIcon, LogInIcon, LogOutIcon } from "../../../components/dashboard/security/icons";
import { getDocument, recordGateMovement } from "../../../firebase/firestore";

const QR_READER_ID = "gate-scan-reader";

// The student dashboard encodes the pass as JSON: { gatePassId, studentId,
// type, from, to }. Older/other QR sources may still send the legacy
// "id|type|from-to" pipe format, so both are accepted — either way only the
// gatePassId (and, if present, studentId — used purely as a cross-check,
// never trusted on its own) is pulled out here. The actual pass fields
// shown and verified always come from the Firestore fetch that follows.
function parseQrPayload(text) {
  const raw = String(text || "").trim();
  try {
    const obj = JSON.parse(raw);
    if (obj && obj.gatePassId) {
      return { gatePassId: String(obj.gatePassId).trim(), studentId: obj.studentId ? String(obj.studentId).trim() : "" };
    }
  } catch {
    // Not JSON — fall through to the legacy pipe format below.
  }
  const [id] = raw.split("|");
  return { gatePassId: (id || "").trim(), studentId: "" };
}

const GATE_ERROR_MESSAGES = {
  STUDENT_MISMATCH: "The scanned QR doesn't match this gate pass's student record — verify the ID manually before proceeding.",
  NOT_APPROVED: "This pass is not currently approved — do not allow exit/entry on it.",
  ALREADY_OUT: "This pass has already been logged out — it can't be logged out twice.",
  ALREADY_RETURNED: "This pass is already completed — the student has already returned.",
  NOT_OUT_YET: "This pass hasn't been logged out yet — log the exit first.",
  EXPIRED: "This pass's valid window has ended — do not allow exit on it.",
  PASS_NOT_FOUND: "This gate pass no longer exists.",
};

function gateErrorMessage(code) {
  return GATE_ERROR_MESSAGES[code] || "Couldn't record this movement. Please try again.";
}

export default function SecurityGateScan() {
  const { profile, user } = useAuth();

  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [logging, setLogging] = useState(false);
  const [justLogged, setJustLogged] = useState("");

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef(null);

  // Every verification — manual or scanned — re-fetches the gatePasses
  // document straight from Firestore. Nothing about whether a pass is
  // valid is ever read from a locally cached list or the QR payload
  // itself, so a scan always reflects the current, real state (and
  // survives a refresh, since nothing here is stored only in React state).
  async function verifyPass(rawId, expectedStudentId) {
    const id = (rawId || "").trim();
    if (!id) return;
    setVerifying(true);
    setVerifyError("");
    setJustLogged("");
    try {
      const pass = await getDocument("gatePasses", id);
      if (!pass) {
        setSearched(null);
        setNotFound(true);
        return;
      }
      setNotFound(false);
      setSearched(pass);
      if (expectedStudentId && pass.studentId && pass.studentId !== expectedStudentId) {
        setVerifyError(gateErrorMessage("STUDENT_MISMATCH"));
      }
    } catch (err) {
      console.error("Failed to verify gate pass:", err);
      setSearched(null);
      setNotFound(true);
    } finally {
      setVerifying(false);
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    verifyPass(query);
  }

  async function stopScan() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // Already stopped/cleared — nothing to do.
      }
    }
  }

  async function startScan() {
    setCameraError("");
    if (scannerRef.current) return; // already running
    setScanning(true);
    // The reader div is display:none until React re-renders with
    // scanning=true; wait one frame so html5-qrcode sizes its video against a
    // visible element instead of a 0x0 one.
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    const scanner = new Html5Qrcode(QR_READER_ID, { verbose: false });
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          const { gatePassId, studentId } = parseQrPayload(decodedText);
          if (!gatePassId) return;
          stopScan();
          setQuery(gatePassId);
          verifyPass(gatePassId, studentId);
        },
        () => {} // per-frame "no QR in view yet" — not an error, ignore
      );
    } catch (err) {
      console.error("Camera scan failed to start:", err);
      scannerRef.current = null;
      setScanning(false);
      // Camera permission denied/unavailable is handled gracefully — the
      // manual Pass ID field below keeps working either way.
      setCameraError("Couldn't access the camera (permission denied or unavailable). Use the Pass ID field below instead.");
    }
  }

  // Stop the camera on unmount so it never keeps running in the background.
  useEffect(() => {
    return () => {
      if (scannerRef.current) stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isExpired = useMemo(() => {
    if (!searched?.to) return false;
    const to = new Date(searched.to);
    return !Number.isNaN(to.getTime()) && new Date() > to;
  }, [searched]);

  async function logDirection(direction) {
    if (!searched || logging) return;
    setLogging(true);
    setVerifyError("");
    try {
      const guard = profile?.name || user?.email || "Security";
      const updated = await recordGateMovement(searched.id, direction, guard, null);
      setSearched(updated);
      setJustLogged(direction);
    } catch (err) {
      setVerifyError(gateErrorMessage(err.message));
    } finally {
      setLogging(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <Card title="Verify a gate pass">
        <p className="-mt-2 mb-4 text-sm text-slate-500">
          Scan the QR code on the student's gate pass screen, or enter the pass ID shown there.
        </p>

        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={scanning ? stopScan : startScan}>
              <CameraIcon /> {scanning ? "Stop camera" : "Scan QR"}
            </Button>
            {verifying && <span className="text-sm text-slate-400">Checking…</span>}
          </div>

          {/* Kept mounted (just hidden) so html5-qrcode always has its
              target element in the DOM before start() is called. */}
          <div
            id={QR_READER_ID}
            className={`overflow-hidden rounded-xl border border-slate-200 shadow-sm shadow-slate-200/60 ${scanning ? "block" : "hidden"}`}
            style={{ maxWidth: 320 }}
          />

          {cameraError && <p className="text-sm text-rose-600">{cameraError}</p>}
        </div>

        <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Gate pass ID">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Paste the pass ID"
                className={inputCls}
              />
            </Field>
          </div>
          <Button type="submit" className="shrink-0" disabled={verifying}>
            <ScanIcon /> Verify
          </Button>
        </form>
      </Card>

      {notFound && (
        <EmptyState
          icon={<ScanIcon />}
          title="No pass found with that ID"
          description="Double-check the ID with the student, or ask them to show their gate pass screen again."
        />
      )}

      {searched && (
        <Card title={`${searched.type} — ${searched.studentName}`} action={<Pill tone={searched.status}>{searched.status}</Pill>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Student</p>
              <p className="mt-1 text-sm text-ink">{searched.studentName} · {searched.room || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reason</p>
              <p className="mt-1 text-sm text-ink">{searched.reason}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valid window</p>
              <p className="mt-1 text-sm text-ink">{searched.from} → {searched.to}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current trip status</p>
              <p className="mt-1 text-sm text-ink">{searched.tripState}</p>
            </div>
          </div>

          {verifyError && (
            <p className="mt-5 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{verifyError}</p>
          )}

          {searched.status !== "Approved" ? (
            <p className="mt-5 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              {searched.status === "Completed"
                ? gateErrorMessage("ALREADY_RETURNED")
                : "This pass is not currently approved — do not allow exit/entry on it."}
            </p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => logDirection("Out")}
                disabled={logging || searched.tripState === "Out" || searched.tripState === "Returned" || isExpired}
              >
                <LogOutIcon /> Log exit
              </Button>
              <Button
                variant="outline"
                onClick={() => logDirection("In")}
                disabled={logging || searched.tripState !== "Out"}
              >
                <LogInIcon /> Log entry
              </Button>
            </div>
          )}

          {justLogged && (
            <p className="mt-3 rounded-xl bg-teal-500/10 px-4 py-2.5 text-sm text-teal-700">
              {justLogged === "Out" ? "Exit logged." : "Entry logged."} Also added to the in/out register.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
