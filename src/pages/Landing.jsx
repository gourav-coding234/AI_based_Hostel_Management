import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import Leadership from "../components/landing/Leadership";
import NoticeBoard from "../components/landing/NoticeBoard";
import Facilities from "../components/landing/Facilities";
import Gallery from "../components/landing/Gallery";
import Brochure from "../components/landing/Brochure";
import Footer from "../components/landing/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <Leadership />
        <NoticeBoard />
        <Facilities />
        <Gallery />
        <Brochure />
      </main>
      <Footer />
    </div>
  );
}
