import { useState, type FormEvent } from "react";

interface RejectApplicationProps {
  application: {
    candidate_name: string;
    job: string;
    id: number;
    stage: string;
  };
  onCancel: () => void;
  onReject: (reason: string) => void;
}

const RejectApplication = ({
  application,
  onCancel,
  onReject,
}: RejectApplicationProps) => {
  const [reason, setReason] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onReject(reason);
  };

  return (
    <div className="modal-backdrop">
      <section
        className="save-modal reject-application-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-application-title"
        aria-describedby="reject-application-description"
      >
        <button
          className="modal-close"
          type="button"
          onClick={onCancel}
          aria-label="Close rejection dialog"
        >
          <span aria-hidden="true">×</span> Close
        </button>
        <div className="save-modal-copy reject-application-copy">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#d32f2f",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              lineHeight: 1,
              marginRight: "8px",
              verticalAlign: "middle",
            }}
            aria-hidden="true"
          >
            !
          </div>
          <h2 id="reject-application-title" style={{ display: "inline" }}>
            Reject {application.candidate_name}?
          </h2>
          <p id="reject-application-description">
            {`${application.job} · currently at ${application.stage.replace(/_/g, " ")}`}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="reject-application-field">
            <label htmlFor="reject-reason">
              Reason (required)<span className="required-field"> *</span>
            </label>
            <textarea
              id="reject-reason"
              name="reject-reason"
              rows={3}
              minLength={3}
              maxLength={500}
              placeholder="Why is this application being rejected?"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
              }}
              required
            />
          </div>

          <p className="reject-application-warning">
            Rejected applications cannot be moved afterwards.
          </p>

          <div className="reject-application-actions">
            <button
              className="modal-button modal-button-secondary"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="modal-button modal-button-primary reject-application-confirm"
              type="submit"
            >
              Reject
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default RejectApplication;
