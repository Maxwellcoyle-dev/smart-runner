# Setting Up garmindb in Railway

We're using a Dockerfile to install Python and garmindb properly in Railway.

## What We're Doing

1. Using Dockerfile instead of nixpacks
2. Installing Python 3 and pip
3. Installing garmindb via pip
4. Setting up the Node.js app

## Step 1: Update Railway to Use Dockerfile

1. Go to Railway Dashboard → Your Backend Service
2. Go to **Settings** tab
3. Look for **"Build Command"** or **"Dockerfile"** settings
4. Railway should auto-detect the Dockerfile
5. If not, make sure the Dockerfile is in the `backend/` directory

## Step 2: Update Environment Variables

Make sure these are set in Railway → Variables:

```
GARMINDB_PYTHON=/usr/bin/python3
GARMINDB_CLI=/usr/local/bin/garmindb_cli.py
DATA_DIR=/app/data
```

## Step 3: Deploy

1. Push the Dockerfile to GitHub:
   ```bash
   git add backend/Dockerfile
   git commit -m "Add Dockerfile for garmindb support"
   git push
   ```

2. Railway will detect the Dockerfile and build using it
3. Watch the build logs - should see:
   - Python installation
   - pip installing garmindb
   - Node.js dependencies installing
   - Server starting

## Step 4: Verify garmindb is Installed

After deployment, check Railway logs for:
- No errors about garmindb not found
- Server starts successfully
- Try syncing - should work now!

## Troubleshooting

### Build fails with "package not found"
- Check Dockerfile syntax
- Verify Python packages are available

### garmindb still not found
- Check `GARMINDB_PYTHON` and `GARMINDB_CLI` paths
- Verify garmindb installed in build logs
- Check if path is `/usr/local/bin/garmindb_cli.py`

### Sync still fails
- Check Railway logs for specific error
- Verify garmindb is in PATH
- Check file permissions

---

**After deploying with Dockerfile, sync should work!**

