"""Token hold: the test suite must run without an Apify token.

Fails when APIFY_TOKEN is set to a non-empty value. The value itself is never printed.
Run tests with: env -u APIFY_TOKEN python -m pytest python/tests
"""

import os


def test_apify_token_is_not_set_in_the_test_environment():
    is_set = (os.environ.get("APIFY_TOKEN") or "").strip() != ""
    assert not is_set, "APIFY_TOKEN is set; unset it (env -u APIFY_TOKEN python -m pytest). Value not printed."
