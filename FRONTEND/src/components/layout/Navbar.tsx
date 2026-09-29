import { useNavigate } from "react-router-dom";

interface Button {
  text: string;
  isEditButton?: boolean;
  buttonChange?: Function;
  navigation?: string;
}

interface NavProps {
  left: string;
  right: Button | string;
  classString: string;
}

const Navbar = (props: NavProps) => {
  const { left, right, classString } = props;
  const navigate = useNavigate();

  const onButtonClick = () => {
    if (typeof right === "object" && right.navigation) {
      navigate(right.navigation);
    } else if (typeof right === "object" && right.isEditButton) {
      if (right.text === "Edit profile") {
        if (typeof right === "object" && right.buttonChange) {
          right.buttonChange;
        }
      } else right.text = "Edit profile";
    }
  };

  return (
    <header className="nav-header">
      <h1 className="nav-title">{left}</h1>

      {typeof right === "object" && right ? (
        <button type="button" className={classString} onClick={onButtonClick}>
          {right.text}
        </button>
      ) : (
        right && <div className={classString}>{right}</div>
      )}
    </header>
  );
};

export default Navbar;
