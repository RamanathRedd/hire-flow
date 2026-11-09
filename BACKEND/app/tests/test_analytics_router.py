from domains.anlaytics import router


def test_analytics_handlers_are_currently_unimplemented():
    assert router.get_job_funnel() is None
    assert router.get_overall_funnel() is None
    assert router.get_time_in_stage_stats() is None
    assert router.get_offer_acceptance_stats() is None
    assert router.get_pipeline_summary() is None
