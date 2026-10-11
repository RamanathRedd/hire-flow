from core.constants import DEPARTMENTS, LOCATIONS
from fastapi import APIRouter
from starlette import status

reference_data_router = APIRouter()


@reference_data_router.get("/departments", status_code=status.HTTP_200_OK)
def get_departments() -> list[dict]:
    return DEPARTMENTS


@reference_data_router.get("/locations", status_code=status.HTTP_200_OK)
def get_locations() -> list[dict]:
    return LOCATIONS
