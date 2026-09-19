# Jobs
# ├── id, title, department, location, job_type (Full-time/Contract)
# ├── description, requirements
# ├── status (Draft / Open / Closed / On-hold)
# ├── created_by (recruiter), created_at
# └── openings_count, filled_count

# Candidates
# ├── id, name, email, phone
# ├── resume_url, linkedin_url
# ├── experience_years
# └── skills (array), created_at

# Applications
# ├── id, job_id, candidate_id
# ├── stage (enum — the state machine)
# ├── stage_updated_at (when did it last move?)
# ├── applied_at, cover_note
# └── rejection_reason (if rejected)

# Application Stage History
# id                → auto assigned
# application_id    → which application this belongs to (links back)
# from_stage        → what stage before (null for first entry)
# to_stage          → what stage after
# changed_at        → exact timestamp
# changed_by        → "system" or recruiter_id
# cover_note             → optional context

# InterviewRounds
# ├── id, application_id
# ├── round_number, round_type (Technical/HR/System Design)
# ├── scheduled_at, interviewer_name
# ├── status (Scheduled/Completed/Cancelled)
# └── feedback, rating (1-5)

# Recruiters
# └── id, name, email, department
