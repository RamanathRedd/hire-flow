from typing import Literal

STAGES = (
    "Applied",
    "Screened",
    "Interview_R1",
    "Interview_R2",
    "HR_Round",
    "Offer",
    "Hired",
    "Rejected",
)
STAGE_LITERAL = Literal[STAGES]
INTERVIEW_STATUS = Literal["Scheduled", "Completed", "Cancelled", "Rescheduled"]
ROUND_TYPE = Literal["Technical", "HR", "System_Design", "Assignment"]
STATUS = Literal["Draft", "Open", "Closed", "On-hold"]
JOB_TYPE = Literal["Full-time", "Contract"]
ROLE = Literal["Admin", "User"]
