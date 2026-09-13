import logo from "../../../assets/logo-full.svg";
import "../auth.css";
import "./LinkExpired.css";

function sendLink(formData: FormData) {
  const email = formData.get("email");
  console.log(email);
}
export default function LinkExpired() {
  return (
    <div className="auth-layout">
      <img src={logo} alt="Better Incidents" className="app-logo" />

      <div className="auth-card">
        <h1 className="auth-title">This link is no longer valid</h1>
        <p className="auth-text">
          Verification links expire after a set time and can only be used once.
          Enter your email and we'll send a new one.
        </p>
        <form action={sendLink} className="custom-form">
          <div className="form-field">
            <label htmlFor="email">Work email</label>
            <input type="email" id="email" name="email" />
          </div>
          <button type="submit" className="app-button">
            Send a new link
          </button>
        </form>
        <a href="/sign-in" className="app-button">
          Back to sign in
        </a>
      </div>
    </div>
  );
}
