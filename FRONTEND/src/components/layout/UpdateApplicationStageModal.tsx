interface UpdateApplicationStageModalProps {
  stage: string;
  candidateName?: string;
  onCancel: () => void;
  onConfirm: (stage: string) => void;
}

const UpdateApplicationStageModal = ({
  stage,
  candidateName,
  onCancel,
  onConfirm,
}: UpdateApplicationStageModalProps) => {
  const formattedStage = stage.replace(/_/g, " ");

  return (
    <div className="modal-backdrop">
      <section
        className="save-modal update-application-stage-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-application-stage-title"
        aria-describedby="update-application-stage-description"
      >
        <button
          className="modal-close"
          type="button"
          onClick={onCancel}
          aria-label="Close stage update dialog"
        >
          <span aria-hidden="true">×</span> Close
        </button>

        <div className="save-modal-copy update-application-stage-copy">
          <h2 id="update-application-stage-title">
            Move {candidateName} to {formattedStage}?
          </h2>

          <p id="update-application-stage-description">
            This will update the application stage for this candidate.
          </p>
        </div>

        <div className="update-application-stage-actions">
          <button
            className="modal-button modal-button-secondary"
            type="button"
            onClick={onCancel}
          >
            No
          </button>
          <button
            className="modal-button modal-button-primary"
            type="button"
            onClick={() => onConfirm(stage)}
          >
            Yes
          </button>
        </div>
      </section>
    </div>
  );
};

export default UpdateApplicationStageModal;
