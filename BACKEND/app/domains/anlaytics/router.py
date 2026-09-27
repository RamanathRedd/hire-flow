from fastapi import APIRouter
from starlette import status

# GET / analytics/funnel/{job_id}       → get_job_funnel
# GET / analytics/funnel/overall        → get_overall_funnel
# GET / analytics/time-in -stage         → get_time_in_stage_stats
# GET / analytics/offer-acceptance      → get_offer_acceptance_stats
# GET / analytics/pipeline-summary      → get_pipeline_summary

analytics_router = APIRouter()


@analytics_router.get("", status_code=status.HTTP_200_OK)
def get_job_funnel():
    pass


@analytics_router.get("", status_code=status.HTTP_200_OK)
def get_overall_funnel():
    pass


@analytics_router.get("", status_code=status.HTTP_200_OK)
def get_time_in_stage_stats():
    pass


@analytics_router.get("", status_code=status.HTTP_200_OK)
def get_offer_acceptance_stats():
    pass


@analytics_router.get("", status_code=status.HTTP_200_OK)
def get_pipeline_summary():
    pass
