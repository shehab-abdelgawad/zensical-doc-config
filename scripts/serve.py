#!/usr/bin/env python3
"""Run `zensical serve` on the first free port from 8200 upward.

Zensical defaults to port 8000, which many other dev servers also claim, and it
has no fallback: a busy port just fails with "Address already in use". base.yml
moves the default to 8200; this wrapper goes further and scans upward from there,
so several doc sites (or other tools) can run side by side.

Usage, from a project root:
    uv run python docs-config/scripts/serve.py [options]

A port counts as free only if nothing listens on it over IPv4 or IPv6, since
browsers may resolve `localhost` to either. The port could be taken between the
check and Zensical binding it; Zensical then fails loudly, so rerun.
"""

import argparse
import errno
import os
import shutil
import socket


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


def first_free_port(start: int, count: int) -> int:
    for port in range(start, start + count):
        if is_free(port):
            return port
    raise SystemExit(f"error: no free port in {start}-{start + count - 1}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run `zensical serve` on the first free port from --first-port upward.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    scan = parser.add_argument_group("port scan")
    scan.add_argument("--host", default="localhost", help="address to serve on")
    scan.add_argument("--first-port", type=int, default=8200, help="first port to try")
    scan.add_argument("--ports", type=int, default=100, help="how many ports to try")

    zensical = parser.add_argument_group("passed to zensical serve")
    zensical.add_argument("-a", "--dev-addr", metavar="IP:PORT", help="serve exactly here; skips the scan")
    zensical.add_argument("-f", "--config-file", metavar="PATH", help="path to config file")
    zensical.add_argument("-o", "--open", action="store_true", help="open preview in default browser")
    zensical.add_argument("-s", "--strict", action="store_true", help="strict mode")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    zensical = shutil.which("zensical")
    if zensical is None:
        raise SystemExit("error: zensical not found - run 'uv sync' and use 'uv run'")

    dev_addr = args.dev_addr or f"{args.host}:{first_free_port(args.first_port, args.ports)}"
    cmd = [zensical, "serve", "--dev-addr", dev_addr]
    if args.config_file:
        cmd += ["--config-file", args.config_file]
    if args.open:
        cmd.append("--open")
    if args.strict:
        cmd.append("--strict")

    # Replace this process so Ctrl-C and exit codes go straight to Zensical.
    os.execv(zensical, cmd)


if __name__ == "__main__":
    main()
