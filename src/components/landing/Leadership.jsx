import principalPhoto from "../../assets/leadership/warden-rajesh-tripathy.jpeg";
import yogeshPhoto from "../../assets/leadership/warden-yogesh-nayak.png";
import rajeshPhoto from "../../assets/leadership/rajesh-tripathy.jpeg";

const leaders = [
  {
    name: "Prof. Saroj Kumar Sarangi",
    role: "Principal",
    detail: "Government College of Engineering, Keonjhar",
    moreDetails: [
      { label: "Joined GCE Keonjhar", value: "4 October 2024" },
      { label: "Education", value: "Postdoctoral research at National Cheng Kung University, Taiwan; Ph.D. from IIT Kharagpur; M.Tech. from NIFFT Ranchi; B.E. from UCE Burla." },
      { label: "Research", value: "CVD diamond coating, high-speed machining, and joining of metal-ceramics." },
    ],
    profileUrl: "https://www.gcekjr.ac.in/about-us/know-more/",
    profileLink: "Official principal profile",
    image: principalPhoto,
    imageAlt: "Prof. Saroj Kumar Sarangi, Principal",
    className: "leadership-card-principal",
  },
  {
    name: "Dr. Rajesh Kumar Tripathy",
    role: "Girls Hostel Warden",
    detail: "HOD, Computer Science & Engineering · Girls hostel administration and student support",
    moreDetails: [
      { label: "Designation", value: "Head of Department, Computer Science & Engineering" },
      { label: "Hostel responsibility", value: "Girls Hostel Warden" },
      { label: "Qualification", value: "Ph.D., IIT Guwahati" },
      { label: "Joined GCE Keonjhar", value: "18 May 2026" },
      { label: "Research interests", value: "Signal and image processing, artificial intelligence, embedded AI systems, and multimodal systems." },
      { label: "Faculty email", value: "rajeshtripathy_fee@gcekjr.ac.in" },
    ],
    profileUrl: "https://www.gcekjr.ac.in/academics/our-faculty/",
    profileLink: "Official faculty profile",
    image: rajeshPhoto,
    imageAlt: "Dr. Rajesh Kumar Tripathy",
  },
  {
    name: "Dr. Yogesh Kumar Nayak",
    role: "Boys Hostel Warden",
    detail: "Hostel administration and student support",
    moreDetails: [
      { label: "Department", value: "Electrical Engineering" },
      { label: "Qualification", value: "M.Tech.; Ph.D., NIT Jamshedpur" },
      { label: "Designation", value: "Assistant Professor" },
      { label: "Joined GCE Keonjhar", value: "13 June 2018" },
      { label: "Research interests", value: "Solar energy and power systems." },
      { label: "Faculty email", value: "yogeshnayak_fee@gcekjr.ac.in" },
    ],
    profileUrl: "https://www.gcekjr.ac.in/departments/electrical-engineering/",
    profileLink: "Official faculty profile",
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
                <details className="leadership-more">
                  <summary>More</summary>
                  <div className="leadership-more-content">
                    <dl>
                      {leader.moreDetails.map(({ label, value }) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <a href={leader.profileUrl} target="_blank" rel="noreferrer">
                      {leader.profileLink} <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </details>
              </div>
              <span className="leadership-rule" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
