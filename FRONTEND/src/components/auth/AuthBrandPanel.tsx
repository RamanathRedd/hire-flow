interface AuthBrandPanelProps {
  tagLine: string;
}

const AuthBrandPanel: React.FC<AuthBrandPanelProps> = (props) => {
  const { tagLine } = props;
  return (
    <aside className="auth-brand-panel" aria-label="HireFlow">
      <div className="auth-brand-copy">
        <h1>HireFlow</h1>
        <p>{tagLine}</p>
      </div>
      <p className="auth-brand-copyright">&copy; HireFlow</p>
    </aside>
  );
};

export default AuthBrandPanel;
