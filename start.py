import os
import sys
import subprocess
import signal
import threading
from pathlib import Path

ROOT_DIR = Path(__file__).parent.resolve()
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

IS_WINDOWS = sys.platform.startswith("win")

def get_python_exe():
    if IS_WINDOWS:
        venv_python = BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
    else:
        venv_python = BACKEND_DIR / ".venv" / "bin" / "python"
    
    if venv_python.exists():
        return str(venv_python)
    return sys.executable

def get_npm_cmd():
    if IS_WINDOWS:
        return "npm.cmd"
    return "npm"

def stream_output(process, prefix, color_code):
    reset_code = "\033[0m"
    try:
        for line in iter(process.stdout.readline, ""):
            if line:
                print(f"{color_code}[{prefix}]{reset_code} {line}", end="", flush=True)
    except Exception:
        pass

def main():
    # Enable ANSI escape sequences on Windows console if supported
    if IS_WINDOWS:
        os.system("")

    print("\033[1;36m====================================================\033[0m")
    print("\033[1;36m       Starting PUSE (Frontend + Backend)           \033[0m")
    print("\033[1;36m====================================================\033[0m")

    python_exe = get_python_exe()
    npm_cmd = get_npm_cmd()

    print(f"\033[34m[Setup]\033[0m Backend Python: {python_exe}")
    print(f"\033[34m[Setup]\033[0m Frontend Manager: {npm_cmd}")

    # Check and warn if frontend dependencies missing
    if not (FRONTEND_DIR / "node_modules").exists():
        print("\033[33m[Setup]\033[0m Installing frontend dependencies...")
        subprocess.run([npm_cmd, "install"], cwd=str(FRONTEND_DIR), check=True)

    # Launch Backend
    backend_cmd = [
        python_exe,
        "-m",
        "uvicorn",
        "main:app",
        "--reload",
        "--host",
        os.getenv("BACKEND_HOST", "0.0.0.0"),
        "--port",
        os.getenv("BACKEND_PORT", "8000")
    ]
    print(f"\033[32m[Launcher]\033[0m Launching Backend: {' '.join(backend_cmd)}")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(BACKEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Launch Frontend
    frontend_cmd = [npm_cmd, "run", "dev"]
    print(f"\033[35m[Launcher]\033[0m Launching Frontend: {' '.join(frontend_cmd)}")
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )

    # Start stream threads
    t_backend = threading.Thread(
        target=stream_output,
        args=(backend_proc, "Backend", "\033[36m"),
        daemon=True
    )
    t_frontend = threading.Thread(
        target=stream_output,
        args=(frontend_proc, "Frontend", "\033[35m"),
        daemon=True
    )
    t_backend.start()
    t_frontend.start()

    print("\n\033[1;32m> Both services started! Press Ctrl+C in this terminal to stop both.\033[0m\n")

    def shutdown(signum=None, frame=None):
        print("\n\033[33m[Shutdown]\033[0m Stopping services...")
        for proc in [frontend_proc, backend_proc]:
            try:
                if IS_WINDOWS:
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    proc.terminate()
            except Exception:
                pass
        print("\033[32m[Shutdown]\033[0m All services stopped.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Wait for any process to exit
    try:
        while True:
            b_poll = backend_proc.poll()
            f_poll = frontend_proc.poll()
            if b_poll is not None:
                print(f"\033[31m[Backend]\033[0m Process exited with code {b_poll}")
                shutdown()
            if f_poll is not None:
                print(f"\033[31m[Frontend]\033[0m Process exited with code {f_poll}")
                shutdown()
            threading.Event().wait(1.0)
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    main()
