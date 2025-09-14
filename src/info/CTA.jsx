import { Component } from "react";
import { FaWhatsapp, FaPhoneAlt, FaEnvelope, FaFileDownload, FaFileAlt } from "react-icons/fa";
import CV from "../assets/cv.pdf";
import "./CTA.css";

class CTA extends Component {
  openCV = () => {
    window.open(CV, "_blank");
  };

  downloadCV = () => {
    const link = document.createElement("a");
    link.href = CV;
    link.download = "Ofer_Waron_CV.pdf";
    link.click();
  };

  render() {
    return (
      <div className="cta-section">
        <div className="about-me-block">
          <h2>About Me</h2>
          <p>
            I'm Ofer Waron, an investment specialist. I provide paid consulting services to help you learn how to grow your money wisely through smart investments.
          </p>
        </div>


      <div className="button-group">
            <button onClick={this.openCV} className="btn btn-view">
              <FaFileAlt /> View PDF
            </button>
            <button onClick={this.downloadCV} className="btn btn-download">
              <FaFileDownload /> Download PDF
            </button>
            </div>
        <hr className="section-divider" />

        <div className="contact-me-block">
          <h2>Contact Me</h2>
          <p>You’re welcome to reach me through any of the options below:</p>
          <div className="button-group">

            <a className="btn btn-email" href="mailto:oferwv123@gmail.com">
              <FaEnvelope /> Mail Me
            </a>
            <a
              className="btn btn-whatsapp"
              href="https://wa.me/972526625716"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaWhatsapp /> WhatsApp Me
            </a>

          </div>
        </div>
      </div>
    );
  }
}

export default CTA;
