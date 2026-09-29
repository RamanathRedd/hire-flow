import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const onPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const onRoleChange = (e: MouseEvent<HTMLButtonElement>) => {
    setIsAdmin(e.currentTarget.name === "recruiter");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const result = await login(email, password, isAdmin);

      sessionStorage.setItem("access_token", result.access_token);
      sessionStorage.setItem("role", result.role);
      navigate(isAdmin ? "/jobs" : "/browseJobs");
    } catch (error) {
      setErrorMessage(
        error instanceof TypeError
          ? "Unable to connect to the server. Check that the backend is running and try again."
          : error instanceof Error
            ? error.message
            : "Sign in failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <AuthBrandPanel tagLine="Track every candidate from application to offer, in one pipeline." />
      <section className="auth-panel" aria-labelledby="login-title">
        <form className="auth-form" onSubmit={handleSubmit}>
          <header className="auth-heading">
            <h1 id="login-title">Sign in</h1>
            <p>Enter your credentials to continue</p>
          </header>

          <div className="role-switch" aria-label="Choose account type">
            <button
              className={isAdmin ? "role-option is-active" : "role-option"}
              type="button"
              onClick={onRoleChange}
              name="recruiter"
              aria-pressed={isAdmin}
            >
              Recruiter
            </button>
            <button
              className={!isAdmin ? "role-option is-active" : "role-option"}
              type="button"
              onClick={onRoleChange}
              name="candidate"
              aria-pressed={!isAdmin}
            >
              Candidate
            </button>
          </div>

          <div className="auth-field">
            <label htmlFor="email">
              Email<span className="required-field"> *</span>
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="ram@example.com"
              value={email}
              onChange={onEmailChange}
              required
            />
          </div>
          <div className="auth-field">
            <label htmlFor="password">
              Password<span className="required-field"> *</span>
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••••"
              value={password}
              onChange={onPasswordChange}
              required
            />
          </div>
          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          {errorMessage && (
            <p className="auth-message is-error" role="alert">
              {errorMessage}
            </p>
          )}
          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create an Account</Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default LoginPage;
