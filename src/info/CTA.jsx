import { FaFileDownload, FaFileAlt } from "react-icons/fa";
import CV from "../assets/files/cv.pdf";
import "../styles/styles.css";
import oferBlack from "../assets/images/oferBlack.jpg";
import { usePerformanceHistory } from "../App";

const CTA = () => {
  const { performance, loading: perfLoading } = usePerformanceHistory();

  const experienceSince =
    performance?.experienceSince ?? "2009"; // fallback if not loaded

  const team = [
    {
      name: "Ofer Waron",
      role: "Lead Strategist & Founder",
      bio: `Investment specialist and architect of the 97% Gold strategy with 16 years of trading experience since ${performance.experienceSince}.`,
      avatar: oferBlack,
    },
  ];

  const openCV = () => {
    window.open(CV, "_blank", "noopener,noreferrer");
  };

  const downloadCV = () => {
    const link = document.createElement("a");
    link.href = CV;
    link.download = "Ofer_Waron_CV.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="cta-section">
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
              <div className="team-avatar">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="team-avatar-img"
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

        <div className="strategy-btn-group" style={{ marginTop: "2rem" }}>
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

      <hr className="section-divider" />
    </div>
  );
};

export default CTA;
