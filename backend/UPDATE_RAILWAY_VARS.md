# Update Railway Environment Variables

You have `GARMINDB_PYTHON = /usr/bin/python3` set in Railway, but it should be the virtual environment path.

## Fix: Update Railway Variables

1. Go to Railway Dashboard → Your Backend Service → **Variables** tab
2. Find `GARMINDB_PYTHON`
3. Change it from:
   ```
   /usr/bin/python3
   ```
   To:
   ```
   /opt/garmindb-venv/bin/python
   ```
4. Also check/add `GARMINDB_CLI`:
   ```
   /opt/garmindb-venv/bin/garmindb_cli.py
   ```

## Why This Matters

- `/usr/bin/python3` = System Python (doesn't have garmindb installed)
- `/opt/garmindb-venv/bin/python` = Virtual environment Python (has garmindb installed)

The Dockerfile installs garmindb in the virtual environment, so we need to use that Python.

## After Updating

Railway will auto-redeploy. Then try syncing again - it should work!
