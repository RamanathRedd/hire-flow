import { useNavigate } from "react-router-dom";

interface Button {
  text: string;
  isEditable?: boolean;
  navigation?: string;
  onClickEditButton?: () => void;
}

interface NavProps {
  leftTitle: string;
  rightText: Button | string;
  classString: string;
}

const Navbar = (props: NavProps) => {
  const { leftTitle, rightText, classString } = props;
  const navigate = useNavigate();

  const onButtonClick = () => {
    if (typeof rightText === "object" && rightText.navigation) {
      navigate(rightText.navigation);
    } else if (typeof rightText === "object") {
      rightText.onClickEditButton?.();
    }
  };

  return (
    <header className="nav-header">
      <h1 className="nav-title">{leftTitle}</h1>

      {typeof rightText === "object" && rightText ? (
        <button type="button" className={classString} onClick={onButtonClick}>
          {rightText.isEditable ? "Save" : `${rightText.text}`}
        </button>
      ) : (
        rightText && <div className={classString}>{rightText}</div>
      )}
    </header>
  );
};

export default Navbar;
