import { FaFileDownload, FaFileAlt } from "react-icons/fa";
import CV from "../assets/files/cv.pdf";
import "../styles/styles.css";
import { useSelfImage } from "../services/selfImages";
import { LoadingImage } from "../components/LoadingMedia";
import { usePerformanceHistory } from "../App";
import { useDocumentUrl, downloadDocument } from "../services/documents";

const CTA = () => {
  const { performance, loading: perfLoading } = usePerformanceHistory();
  const avatarSrc = useSelfImage(2); // selfimages/ofernewSelfimage2.jpg
  // documents/cv.pdf from Firebase Storage; the bundled CV is used until/unless it loads
  const cvUrl = useDocumentUrl("cv.pdf");

  const experienceSince =
    performance?.experienceSince ?? "2009"; // fallback if not loaded

  const team = [
    {
      name: "Ofer Waron",
      role: "Lead Strategist & Founder",
      bio: `Investment specialist and architect of the 97% Gold strategy with 16 years of trading experience since ${experienceSince}.`,
      avatar: avatarSrc,
    },
  ];

  const openCV = () => {
    window.open(cvUrl || CV, "_blank", "noopener,noreferrer");
  };

  const downloadBundledCV = () => {
    const link = document.createElement("a");
    link.href = CV;
    link.download = "Ofer_Waron_CV.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadCV = () => {
    downloadDocument("cv.pdf", "Ofer_Waron_CV.pdf").catch((err) => {
      console.error("Firebase CV download failed, using bundled copy:", err);
      downloadBundledCV();
    });
  };

  return (
    <div className="cta-section">
      {/* Scrollable content area */}
      <div className="about-panel-scroll">
        <div className="about-me-block">
          <div className="text-center">
            <p className="strategy-subtitle" style={{ marginBottom: "1.5rem" }}>
              I'm <strong>Ofer Waron</strong>, an investment specialist. I provide paid
              consulting services through my WhatsApp signals group to help you grow your money wisely
              through disciplined investment strategies.
            </p>
          </div>

          <div className="team-grid">
            {team.map((member, i) => (
              <div key={i} className="strategy-rule-card team-card">
                <div className="team-avatar media-loading-box">
                  <LoadingImage
                    src={member.avatar}
                    alt={member.name}
                    className="team-avatar-img"
                    coinSize={64}
                  />
                </div>

                <h3 className="strategy-rule-title">{member.name}</h3>
                <p className="team-role">{member.role}</p>

                <p className="strategy-rule-desc">
                  {perfLoading ? "Loading..." : member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons pinned at bottom */}
      <div className="about-panel-footer">
        <div className="strategy-btn-group">
          <button onClick={openCV} className="strategy-btn strategy-btn-secondary">
            <FaFileAlt /> View PDF
          </button>
          <button
            onClick={downloadCV}
            className="strategy-btn strategy-btn-primary"
          >
            <FaFileDownload /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default CTA;
