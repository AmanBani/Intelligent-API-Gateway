#!/usr/bin/env python3
"""
Check Redis keys and values used by the API Gateway.
Run from project root: python backend/gateway/scripts/check_redis.py
Or from backend/gateway: python scripts/check_redis.py

Uses REDIS_URL from env, default redis://localhost:6380
"""
import os
import sys

try:
    import redis
except ImportError:
    print("Install redis: pip install redis")
    sys.exit(1)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6380")


def main():
    try:
        r = redis.from_url(REDIS_URL, decode_responses=True)
        r.ping()
    except Exception as e:
        print(f"Cannot connect to Redis at {REDIS_URL}: {e}")
        print("Start Redis with: docker compose up -d  (from project root)")
        sys.exit(1)

    print(f"Connected to Redis: {REDIS_URL}\n")
    print("=" * 60)
    print("RATE LIMITING (rate_limit:<user>)")
    print("=" * 60)
    for key in r.scan_iter("rate_limit:*"):
        val = r.get(key)
        ttl = r.ttl(key)
        print(f"  {key}")
        print(f"    requests: {val}, resets in: {ttl}s")
    if not any(r.scan_iter("rate_limit:*")):
        print("  (no keys yet)")

    print("\n" + "=" * 60)
    print("LOAD BALANCER – health (up_health:<upstream>)")
    print("=" * 60)
    for key in sorted(r.scan_iter("up_health:*")):
        val = r.get(key)
        print(f"  {key}: {val}")
    if not any(r.scan_iter("up_health:*")):
        print("  (no keys yet)")

    print("\n" + "=" * 60)
    print("LOAD BALANCER – connections (up_conn:<upstream>)")
    print("=" * 60)
    for key in sorted(r.scan_iter("up_conn:*")):
        val = r.get(key)
        print(f"  {key}: {val}")
    if not any(r.scan_iter("up_conn:*")):
        print("  (no keys yet)")

    print("\n" + "=" * 60)
    print("LOAD BALANCER – failures (up_fail:<upstream>)")
    print("=" * 60)
    for key in sorted(r.scan_iter("up_fail:*")):
        val = r.get(key)
        print(f"  {key}: {val}")
    if not any(r.scan_iter("up_fail:*")):
        print("  (no keys yet)")

    print("\n" + "=" * 60)
    print("LOAD BALANCER – latency ms (up_lat:<upstream>)")
    print("=" * 60)
    for key in sorted(r.scan_iter("up_lat:*")):
        val = r.get(key)
        print(f"  {key}: {val} ms")
    if not any(r.scan_iter("up_lat:*")):
        print("  (no keys yet)")

    print("\n" + "=" * 60)
    print("ALL KEYS (any other)")
    print("=" * 60)
    seen = set()
    for key in r.scan_iter("*"):
        if key.startswith("rate_limit:") or key.startswith("up_"):
            continue
        seen.add(key)
        val = r.get(key)
        ttl = r.ttl(key)
        ttls = f", TTL: {ttl}s" if ttl > 0 else ""
        print(f"  {key}: {val}{ttls}")
    if not seen:
        print("  (none)")


if __name__ == "__main__":
    main()
