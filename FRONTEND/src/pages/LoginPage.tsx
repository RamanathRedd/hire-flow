import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";
import { Link, useNavigate } from "react-router-dom";
import { useLogin } from "../hooks/useAuth";

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const onPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const onRoleChange = (e: MouseEvent<HTMLButtonElement>) => {
    setIsAdmin(e.currentTarget.name === "recruiter");
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate(
      { email, password, isAdmin },
      {
        onSuccess: (result) => {
          sessionStorage.setItem("access_token", result.access_token);
          sessionStorage.setItem("role", result.role);
          resetForm();
          navigate(isAdmin ? "/jobs" : "/browse-jobs");
        },
      },
    );
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
          <button
            className="auth-submit"
            type="submit"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
          {loginMutation.isError && (
            <p className="auth-message is-error" role="alert">
              {loginMutation.error.message}
            </p>
          )}
          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register" className="create-link">
              Create an Account
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
};

export default LoginPage;
