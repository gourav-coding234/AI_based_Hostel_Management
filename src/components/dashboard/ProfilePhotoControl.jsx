import { useEffect, useRef, useState } from "react";
import ProfileAvatar from "./ProfileAvatar";

function CameraIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true"><path d="M4 7h3l1.5-2h7L17 7h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
}

export default function ProfilePhotoControl({ photoURL, name, email, upload, remove, uploading, progress, stage, error }) {
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);
  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const previewRef = useRef("");
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!cameraOpen || !cameraStreamRef.current || !videoRef.current) return;
    videoRef.current.srcObject = cameraStreamRef.current;
    videoRef.current.play().catch(() => setCameraError("The camera preview could not start. Check camera permission and try again."));
  }, [cameraOpen]);

  const label = (name || email || "User").trim();
  const initials = label.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  function selectFile(selected) {
    if (!selected) return;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(selected);
    setPreviewURL(previewRef.current);
    setZoom(1);
    setFile(selected);
  }

  function choose(event) {
    const selected = event.target.files?.[0] || null;
    event.target.value = "";
    selectFile(selected);
  }

  async function startCamera() {
    setSourceOpen(false);
    setCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraRef.current?.click();
      return;
    }
    try {
      cameraStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      });
      setCameraOpen(true);
    } catch (cause) {
      setCameraError(cause?.name === "NotAllowedError"
        ? "Camera permission was blocked. Allow camera access in your browser, or choose a photo from your device."
        : "The camera could not be opened. Choose a photo from your device instead.");
      setSourceOpen(true);
    }
  }

  function stopCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth || !video?.videoHeight) {
      setCameraError("Wait for the camera preview to appear, then take the photo.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("The photo could not be captured. Please try again.");
      return;
    }
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("The photo could not be prepared. Please try again.");
        return;
      }
      selectFile(new File([blob], "profile-camera.jpg", { type: "image/jpeg" }));
      stopCamera();
    }, "image/jpeg", 0.92);
  }

  function clearSelection() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = "";
    setPreviewURL("");
    setFile(null);
  }

  async function confirmPhoto() {
    const result = await upload(file, { zoom });
    if (result) clearSelection();
  }

  async function clearPhoto() {
    if (await remove()) clearSelection();
  }

  return (
    <div className="flex flex-col items-center gap-2 sm:items-start">
      <div className="relative h-24 w-24 shrink-0">
        <button type="button" onClick={() => setSourceOpen(true)} disabled={uploading} aria-label="Change profile photo" className="group relative h-24 w-24 overflow-hidden rounded-full bg-teal-50 ring-4 ring-slate-100 disabled:cursor-wait">
          <ProfileAvatar src={photoURL} initials={initials} className="h-full w-full object-cover" fallbackClassName="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-teal-700" />
          <span className="absolute inset-0 flex items-end justify-center bg-black/0 pb-3 text-white opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">Change</span>
        </button>
        <button type="button" onClick={() => setSourceOpen(true)} disabled={uploading} aria-label="Choose a profile photo" className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white shadow-md ring-2 ring-white transition hover:bg-teal-500 disabled:opacity-60"><CameraIcon /></button>
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={choose} />
        <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={choose} />
      </div>
      {uploading && <p role="status" className="text-xs text-teal-700">{stage === "Uploading photo" ? `Preparing photo… ${progress}%` : `${stage || "Saving photo"}…`}</p>}

      {sourceOpen && !file && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSourceOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="profile-photo-source-title" className="w-full max-w-sm rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
            <h2 id="profile-photo-source-title" className="font-display text-xl font-semibold">Change profile photo</h2>
            <p className="mt-1 text-sm text-slate-500">Take a new photo or choose one from your device.</p>
            <div className="mt-5 grid gap-2">
              <button type="button" onClick={startCamera} className="rounded-lg bg-navy-950 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-navy-900">Take a photo</button>
              {cameraError && <p role="alert" className="text-sm text-rose-600">{cameraError}</p>}
              <button type="button" onClick={() => { setSourceOpen(false); galleryRef.current?.click(); }} className="rounded-lg border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50">Choose from device</button>
              <button type="button" onClick={() => setSourceOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </section>
        </div>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) stopCamera(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="profile-camera-title" className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
            <h2 id="profile-camera-title" className="font-display text-xl font-semibold">Take a profile photo</h2>
            <p className="mt-1 text-sm text-slate-500">Position yourself in the preview, then capture.</p>
            <video ref={videoRef} autoPlay playsInline muted className="mt-5 aspect-square w-full rounded-xl bg-slate-950 object-cover" style={{ transform: "scaleX(-1)" }} />
            {cameraError && <p role="alert" className="mt-3 text-sm text-rose-600">{cameraError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={stopCamera} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={capturePhoto} className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-900">Capture photo</button>
            </div>
          </section>
        </div>
      )}

      {file && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !uploading) clearSelection(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="profile-photo-title" className="w-full max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
            <h2 id="profile-photo-title" className="font-display text-xl font-semibold">Set profile photo</h2>
            <p className="mt-1 text-sm text-slate-500">Adjust the circular crop, then save your photo.</p>
            <div className="mx-auto my-6 flex h-56 w-56 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-200">
              {previewURL && <img src={previewURL} alt="Preview of your profile photo" className="h-full w-full object-cover" style={{ transform: `scale(${zoom})` }} />}
            </div>
            <label className="block text-sm font-medium text-slate-700">Zoom <span className="font-normal text-slate-500">{zoom.toFixed(1)}×</span>
              <input type="range" min="1" max="2.5" step="0.1" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} disabled={uploading} className="mt-2 w-full accent-teal-600" />
            </label>
            {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {photoURL && <button type="button" onClick={clearPhoto} disabled={uploading} className="mr-auto rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50">Remove current photo</button>}
              <button type="button" onClick={clearSelection} disabled={uploading} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={confirmPhoto} disabled={!previewURL || uploading} className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-900 disabled:cursor-wait disabled:opacity-60">{uploading ? "Saving…" : "Use photo"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
