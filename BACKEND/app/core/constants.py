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
STATUS = Literal["Draft", "Open", "Closed", "On-hold"]
JOB_TYPE = Literal["Full-time", "Contract"]
ROLE = Literal["Admin", "User"]
LOCATIONS_LITERAL = Literal[
    "Ahmedabad",
    "Bengaluru",
    "Chennai",
    "Delhi",
    "Gurugram",
    "Hybrid",
    "Hyderabad",
    "Jaipur",
    "Kochi",
    "Kolkata",
    "Mumbai",
    "Noida",
    "Pune",
    "Remote",
]
LOCATIONS = [
    {"id": id, "name": name}
    for id, name in enumerate(get_args(LOCATIONS_LITERAL), start=1)
]
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
