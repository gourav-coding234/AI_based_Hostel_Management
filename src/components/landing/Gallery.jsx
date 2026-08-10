import { useState } from "react";
import heroImg from "../../assets/hero.png";

// TODO: replace with real hostel photos (block exteriors, rooms, mess, common areas).
const GALLERY_IMAGES = [
  { id: "g1", src: heroImg, alt: "Hostel block exterior" },
  { id: "g2", src: heroImg, alt: "Student room" },
  { id: "g3", src: heroImg, alt: "Dining hall" },
  { id: "g4", src: heroImg, alt: "Study hall" },
  { id: "g5", src: heroImg, alt: "Campus grounds" },
  { id: "g6", src: heroImg, alt: "Common recreation area" },
];

export default function Gallery() {
  const [active, setActive] = useState(null);

  return (
    <section id="gallery" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
          Around the hostel
        </span>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">Gallery</h2>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {GALLERY_IMAGES.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(img)}
              className="group aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200 bg-white"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-950/90 p-6"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
        >
          <img
            src={active.src}
            alt={active.alt}
            className="max-h-[80vh] max-w-3xl rounded-2xl shadow-soft"
          />
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
