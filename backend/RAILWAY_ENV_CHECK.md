# Railway Environment Variables Check

The sync is still using `/usr/bin/python3` instead of the virtual environment Python. This means the environment variables might not be set in Railway.

## Check Railway Environment Variables

1. Go to Railway Dashboard → Your Backend Service
2. Click on the **Variables** tab
3. Verify these variables are set:
   - `GARMINDB_PYTHON=/opt/garmindb-venv/bin/python`
   - `GARMINDB_CLI=/opt/garmindb-venv/bin/garmindb_cli.py`
   - `DATA_DIR=/app/data`

## If Variables Are Missing

Add them in Railway:
1. Click **+ New Variable**
2. Add each variable with the exact values above
3. Railway will auto-redeploy

## Alternative: Verify Dockerfile ENV

The Dockerfile sets these as ENV variables, so they should be available. But Railway might need them explicitly set in the Variables tab.

## Check Railway Logs

After adding variables, check the logs when you try to sync. You should see:
```
[SYNC] Using garmindb Python: /opt/garmindb-venv/bin/python
[SYNC] Using garmindb CLI: /opt/garmindb-venv/bin/garmindb_cli.py
```

If you still see `/usr/bin/python3`, the environment variables aren't being picked up.

