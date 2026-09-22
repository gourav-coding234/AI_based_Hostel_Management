import { missingFirebaseKeys } from "../firebase/config";

/**
 * Rendered instead of the app when the Firebase env vars are missing, so a
 * fresh clone shows actionable instructions rather than a blank white page.
 * Deliberately has zero dependencies on Firebase, routing or auth.
 */
export default function SetupRequired() {
  const missing = missingFirebaseKeys();

  return (
    <div className="setup-page">
      <div className="setup-card">
        <span className="setup-badge">Setup required</span>
        <h1 className="setup-title">Firebase isn&apos;t configured yet</h1>
        <p className="setup-lead">
          The portal needs its Firebase credentials before it can start. This takes about two
          minutes.
        </p>

        <ol className="setup-steps">
          <li>
            In the <code>app</code> folder, copy <code>.env.example</code> to a new file named{" "}
            <code>.env</code>.
          </li>
          <li>
            Open the{" "}
            <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">
              Firebase console
            </a>{" "}
            → <strong>Project settings</strong> → <strong>General</strong> → <strong>Your apps</strong>{" "}
            → <strong>SDK setup and configuration</strong>, and copy each value across.
          </li>
          <li>
            Stop the dev server and run <code>npm run dev</code> again — Vite only reads{" "}
            <code>.env</code> at startup.
          </li>
        </ol>

        {missing.length > 0 && (
          <div className="setup-missing">
            <p className="setup-missing-label">
              Missing {missing.length === 1 ? "variable" : `${missing.length} variables`}:
            </p>
            <ul>
              {missing.map((key) => (
                <li key={key}>
                  <code>{key}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="setup-foot">
          Full instructions, including the Firestore collections and security rules, are in{" "}
          <code>README.md</code>.
        </p>
      </div>
    </div>
  );
}
