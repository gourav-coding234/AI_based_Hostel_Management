import { useState } from "react";

// TODO: replace these icon tiles with real hostel photos (block exteriors, rooms, mess, common areas).
const GALLERY_IMAGES = [
  {
    id: "g1",
    alt: "Hostel block exterior",
    icon: <path d="M3 10.5 12 4l9 6.5M5 9.5V19h5v-5h4v5h5V9.5" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    id: "g2",
    alt: "Student room",
    icon: <path d="M4 4h16v16H4zM8 4v2M16 4v2M12 15a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    id: "g3",
    alt: "Dining hall",
    icon: <path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M17 3v18M14 8h6" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    id: "g4",
    alt: "Study hall",
    icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v19H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    id: "g5",
    alt: "Campus grounds",
    icon: <path d="M12 3v6m0 0-3.5 3.5M12 9l3.5 3.5M5 21c0-4 3-7 7-7s7 3 7 7" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    id: "g6",
    alt: "Common recreation area",
    icon: <path d="M6 7v10M18 7v10M2 9v6M22 9v6M6 12h12" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

export default function Gallery() {
  const [active, setActive] = useState(null);

  return (
    <section id="gallery" className="section on-paper">
      <div className="section-inner">
        <span className="section-label">Around the hostel</span>
        <h2 className="section-title">Gallery</h2>
        <p className="section-note" style={{ marginTop: 8 }}>
          Photos are on the way — for now, here's a preview of what each block covers.
        </p>

        <div className="gallery-grid">
          {GALLERY_IMAGES.map((img) => (
            <button key={img.id} type="button" onClick={() => setActive(img)} className="gallery-tile">
              <span className="gallery-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  {img.icon}
                </svg>
              </span>
              <span className="gallery-caption">{img.alt}</span>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          className="lightbox"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
        >
          <div className="lightbox-panel">
            <span className="lightbox-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                {active.icon}
              </svg>
            </span>
            <p className="lightbox-title">{active.alt}</p>
            <p className="lightbox-desc">Photo coming soon.</p>
          </div>
          <button type="button" onClick={() => setActive(null)} className="lightbox-close" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
