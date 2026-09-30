#!/usr/bin/env python3
"""Run `zensical serve` on the first free port from 8200 upward.

Zensical defaults to port 8000, which many other dev servers also claim, and it
has no fallback: a busy port just fails with "Address already in use". base.yml
moves the default to 8200; this wrapper goes further and scans upward from there,
so several doc sites (or other tools) can run side by side.

Usage, from a project root:
    uv run python docs-config/scripts/serve.py [zensical serve options]

All options are passed through to `zensical serve`. An explicit `-a/--dev-addr`
disables the scan. A port counts as free only if nothing listens on it over IPv4
or IPv6, since browsers may resolve `localhost` to either. The port could be taken
between the check and Zensical binding it; Zensical then fails loudly, so rerun.
"""

from __future__ import annotations

import errno
import os
import shutil
import socket
import sys

HOST = "localhost"
FIRST_PORT = 8200
PORTS_TO_TRY = 100


def is_free(port: int) -> bool:
    """True if `port` can be bound on both loopback addresses."""
    for family, addr in ((socket.AF_INET, "127.0.0.1"), (socket.AF_INET6, "::1")):
        try:
            with socket.socket(family, socket.SOCK_STREAM) as s:
                s.bind((addr, port))
        except OSError as e:
            # No IPv6 on this machine: nothing can listen there either.
            if family == socket.AF_INET6 and e.errno == errno.EADDRNOTAVAIL:
                continue
            return False
    return True


def first_free_port(start: int = FIRST_PORT, count: int = PORTS_TO_TRY) -> int:
    for port in range(start, start + count):
        if is_free(port):
            return port
    raise SystemExit(f"error: no free port in {start}-{start + count - 1}")


def main(argv: list[str]) -> None:
    zensical = shutil.which("zensical")
    if zensical is None:
        raise SystemExit("error: zensical not found - run 'uv sync' and use 'uv run'")

    explicit = any(a in ("-a", "--dev-addr") or a.startswith("--dev-addr=") for a in argv)
    if not explicit:
        argv = ["--dev-addr", f"{HOST}:{first_free_port()}", *argv]

    # Replace this process so Ctrl-C and exit codes go straight to Zensical.
    os.execv(zensical, [zensical, "serve", *argv])


if __name__ == "__main__":
    main(sys.argv[1:])
