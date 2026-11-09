from core.constants import DEPARTMENTS, LOCATIONS
from domains.reference_data import router


def test_get_departments_returns():
    assert router.get_departments() == DEPARTMENTS


def test_get_locations_returns():
    assert router.get_locations() == LOCATIONS
