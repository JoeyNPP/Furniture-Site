"""Remote command runner for the NPP Deals droplet.

Usage:
    python scripts/remote_exec_paramiko.py                      # run default health checks
    python scripts/remote_exec_paramiko.py "docker compose ps"    # run a custom command inside the project root
"""

import argparse
import shlex
import sys
from typing import Iterable, Tuple

import paramiko

HOST = "104.131.49.141"
USERNAME = "root"
PASSWORD = "dont2025$Forget"
SITE_ROOT = "/root/NPP_Deals"

DEFAULT_COMMANDS: Tuple[Tuple[str, str], ...] = (
    ("pyenv", "pyenv --version"),
    ("python", "python --version"),
    ("pip", "pip --version"),
    ("node", "node --version"),
    ("npm", "npm --version"),
    ("disk", "df -h /dev/vda1"),
    ("docker-status", f"cd {SITE_ROOT} && docker compose ps"),
    ("api-health", "curl --fail http://localhost:8000/"),
)


def run_remote_commands(commands: Iterable[Tuple[str, str]]) -> int:
    """Execute commands over SSH and stream output to stdout/stderr."""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(
            hostname=HOST,
            username=USERNAME,
            password=PASSWORD,
            allow_agent=False,
            look_for_keys=False,
            timeout=15,
        )
    except Exception as exc:  # pragma: no cover - connectivity issues
        sys.stderr.write(f"Connection failed: {exc}\n")
        return 1

    try:
        for label, command in commands:
            sys.stdout.write(f"\n=== {label} ===\n")
            sys.stdout.flush()
            bash_wrapped = f"bash -lc {shlex.quote(command)}"
            stdin, stdout, stderr = client.exec_command(bash_wrapped, get_pty=True)
            for line in stdout:
                sys.stdout.write(line)
            for line in stderr:
                sys.stderr.write(line)
            exit_status = stdout.channel.recv_exit_status()
            if exit_status != 0:
                sys.stderr.write(f"Command '{command}' exited with {exit_status}\n")
                return exit_status
    finally:
        client.close()
    return 0


def normalize_custom_command(raw_command: str) -> str:
    """Ensure ad-hoc commands run from the project root unless already anchored."""
    striped = raw_command.strip()
    if striped.startswith("cd ") or striped.startswith("bash "):
        return striped
    return f"cd {SITE_ROOT} && {striped}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Run remote diagnostics on the droplet.")
    parser.add_argument("command", nargs="?", help="A single command to execute remotely.")
    args = parser.parse_args()

    if args.command:
        commands = (("custom", normalize_custom_command(args.command)),)
    else:
        commands = DEFAULT_COMMANDS

    return run_remote_commands(commands)


if __name__ == "__main__":
    sys.exit(main())