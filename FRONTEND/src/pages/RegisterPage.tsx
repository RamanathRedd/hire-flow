import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import { Link } from "react-router-dom";
import AuthBrandPanel from "../components/auth/AuthBrandPanel";

const RegisterPage = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(true);

  const onRoleChange = (e: MouseEvent<HTMLButtonElement>) => {
    setIsAdmin(e.currentTarget.name === "recruiter");
  };

  const onNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const onPhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
  };

  const onDepartmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDepartment(e.target.value);
  };

  const onPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const onConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted", e);
    setName("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setPassword("");
    setConfirmPassword("");
    setIsAdmin(true);
  };

  return (
    <main className="auth-page">
      <AuthBrandPanel tagLine="Set up your account to start posting roles and managing your pipeline." />
      <section className="auth-panel" aria-labelledby="register-title">
        <form className="auth-form" onSubmit={handleSubmit}>
          <header className="auth-heading register-heading">
            <h1 id="register-title">Create your account</h1>
            <p>
              Already have one? <Link to="/">Sign in instead</Link>
            </p>
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
          <div className="register-fields">
            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={name}
                onChange={onNameChange}
                placeholder="Ramanath Reddy"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                name="email"
                value={email}
                onChange={onEmailChange}
                placeholder="ram@example.com"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={phone}
                onChange={onPhoneChange}
                placeholder="9391233969"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                type="text"
                name="department"
                value={department}
                onChange={onDepartmentChange}
                placeholder="Engineering"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="register-password">Password</label>
              <input
                id="register-password"
                type="password"
                name="password"
                value={password}
                onChange={onPasswordChange}
                placeholder="••••••••••"
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onConfirmPasswordChange}
                placeholder="••••••••••"
                required
              />
            </div>
          </div>
          <button className="auth-submit" type="submit">
            Create account
          </button>
        </form>
      </section>
    </main>
  );
};

export default RegisterPage;
