import structlog

structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(0),
    context_class=dict,
    cache_logger_on_first_use=True,
)

_logger = structlog.get_logger()


def log(event: str, **kwargs):
    _logger.info(event, **kwargs)
