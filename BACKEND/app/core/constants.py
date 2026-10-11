from typing import Literal, get_args

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


STATUS_LITERAL = Literal["Draft", "Open", "Closed", "On-hold"]
STATUS = [
    {"id": id, "name": name}
    for id, name in enumerate(get_args(STATUS_LITERAL), start=1)
]
JOB_TYPE = Literal["Full-time", "Contract"]
ROLE = Literal["Admin", "User"]
DEPARTMENTS = [
    {"id": 1, "name": "Engineering"},
    {"id": 2, "name": "Product"},
    {"id": 3, "name": "Design"},
    {"id": 4, "name": "Data & Analytics"},
    {"id": 5, "name": "IT"},
    {"id": 6, "name": "Marketing"},
    {"id": 7, "name": "Sales"},
    {"id": 8, "name": "Human Resources"},
    {"id": 9, "name": "Finance"},
    {"id": 10, "name": "Operations"},
    {"id": 11, "name": "Customer Support"},
    {"id": 12, "name": "Legal"},
]
