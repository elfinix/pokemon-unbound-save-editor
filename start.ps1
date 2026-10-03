$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
python "$scriptDir\start.py" @args
