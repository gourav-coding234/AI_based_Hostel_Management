import principalPhoto from "../../assets/leadership/warden-rajesh-tripathy.jpeg";
import yogeshPhoto from "../../assets/leadership/warden-yogesh-nayak.png";
import rajeshPhoto from "../../assets/leadership/rajesh-tripathy.jpeg";

const leaders = [
  {
    name: "Prof. Saroj Kumar Sarangi",
    role: "Principal",
    detail: "Government College of Engineering, Keonjhar",
    image: principalPhoto,
    imageAlt: "Prof. Saroj Kumar Sarangi, Principal",
    className: "leadership-card-principal",
  },
  {
    name: "Dr. Rajesh Kumar Tripathy",
    role: "Girls Hostel Warden",
    detail: "HOD, Computer Science & Engineering · Hostel administration and student support",
    image: rajeshPhoto,
    imageAlt: "Dr. Rajesh Kumar Tripathy",
  },
  {
    name: "Dr. Yogesh Kumar Nayak",
    role: "Boys Hostel Warden",
    detail: "Hostel administration and student support",
    image: yogeshPhoto,
    imageAlt: "Dr. Yogesh Kumar Nayak",
  },
];

export default function Leadership() {
  return (
    <section id="leadership" className="section on-white leadership-section">
      <div className="section-inner">
        <div className="section-head leadership-heading">
          <div>
            <span className="section-label">College administration</span>
            <h2 className="section-title">Leadership &amp; hostel support</h2>
          </div>
          <p className="section-note">The people guiding campus life and resident support at GCE Keonjhar.</p>
        </div>

        <div className="leadership-grid">
          {leaders.map((leader) => (
            <article key={leader.name} className={`leadership-card ${leader.className || ""}`}>
              <div className="leadership-portrait">
                <img src={leader.image} alt={leader.imageAlt} loading="lazy" />
              </div>
              <div className="leadership-copy">
                <span className="leadership-role">{leader.role}</span>
                <h3>{leader.name}</h3>
                <p>{leader.detail}</p>
              </div>
              <span className="leadership-rule" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
