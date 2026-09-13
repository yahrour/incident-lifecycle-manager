import logo from "../../../assets/logo-full.svg";
import success from "../../../assets/success-svgrepo-com.svg";

import "../auth.css";
import "./EmailVerified.css";

export default function EmailVerified() {
  return (
    <div className="auth-layout">
      <img src={logo} alt="Better Incidents" className="app-logo" />

      <div className="auth-card">
        <img src={success} alt="Success Icon" className="success-icon" />
        <h1 className="auth-title">Email verified</h1>
        <p className="auth-text">
          Congratulations! You have successfully verified your email address
        </p>
        <a href="/sign-in" className="app-button">
          Go to app
        </a>
      </div>
    </div>
  );
}
