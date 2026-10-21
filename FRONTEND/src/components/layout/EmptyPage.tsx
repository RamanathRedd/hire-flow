import { useNavigate } from "react-router-dom";

interface EmptyPageProps {
  icon: string;
  title: string;
  subTitle: string;
  button: {
    text: string;
    navigation?: string;
    onClick?: () => void;
  };
}

const EmptyPage = ({ icon, title, subTitle, button }: EmptyPageProps) => {
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (button.onClick) {
      button.onClick();
    } else if (button.navigation) {
      navigate(button.navigation);
    }
  };

  return (
    <div className="empty-page">
      <div className="empty-page-icon">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={icon} />
        </svg>
      </div>
      <h2 className="empty-page-title">{title}</h2>
      <p className="empty-page-subtitle">{subTitle}</p>
      <button
        className="empty-page-button"
        type="button"
        onClick={handleButtonClick}
      >
        {button.text}
      </button>
    </div>
  );
};

export default EmptyPage;
