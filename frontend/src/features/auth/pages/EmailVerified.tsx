import success from "../../../assets/success-svgrepo-com.svg";
import { Link } from "react-router";
import "../auth.css";
import { AuthCard } from "../components/AuthCard";
import "./EmailVerified.css";

export default function EmailVerified() {
  return (
    <AuthCard>
      <div className="auth-card">
        <img src={success} alt="Success Icon" className="success-icon" />
        <h1 className="auth-title">Email verified</h1>
        <p className="auth-text">
          Congratulations! You have successfully verified your email address
        </p>
        <Link to="/sign-in" className="app-button">
          Go to app
        </Link>
      </div>
    </AuthCard>
  );
}
