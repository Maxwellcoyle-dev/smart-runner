# Dockerfile Setup for garmindb

I've created a Dockerfile that will install Python and garmindb in Railway.

## What the Dockerfile Does

1. Uses Node.js 18 base image
2. Installs Python 3 and pip
3. Installs garmindb via pip
4. Sets up the Node.js app
5. Configures garmindb paths

## Step 1: Commit and Push

```bash
git add backend/Dockerfile backend/.dockerignore backend/server.js backend/routes/garmin.js
git commit -m "Add Dockerfile for garmindb support in Railway"
git push
```

## Step 2: Railway Will Auto-Detect Dockerfile

Railway should automatically detect the Dockerfile and use it instead of nixpacks.

## Step 3: Update Environment Variables

Make sure these are set in Railway → Variables:

```
GARMINDB_PYTHON=/usr/bin/python3
GARMINDB_CLI=/usr/local/bin/garmindb_cli.py
DATA_DIR=/app/data
```

**Note**: The code will try both the CLI path and Python module approach, so it should work even if the exact path varies.

## Step 4: Watch Build Logs

After pushing, check Railway build logs. You should see:
- Python installation
- `pip3 install garmindb`
- Node.js dependencies
- Server starting

## Step 5: Test Sync

After deployment completes:
1. Try syncing data
2. Check Railway logs for any errors
3. Should see garmindb executing

## Troubleshooting

### Build fails
- Check Dockerfile syntax
- Verify all packages are available

### garmindb not found after build
- Check build logs for pip install errors
- Verify garmindb installed successfully
- The code will try both CLI and module approaches

### Sync still fails
- Check Railway logs for specific error
- Verify garmindb command is executing
- Check file permissions in `/app/data`

---

**After pushing, Railway will rebuild with Dockerfile and garmindb should be available!**

