# Deployment Troubleshooting Guide

## Common Build Issues

### Issue: "No module named pip"

**Problem**: Python3 from Nix doesn't include pip by default.

**Solution**: The `nixpacks.toml` now installs pip using get-pip.py. If this still fails, try:

1. **Option 1**: Skip garmindb for now (app will work without sync)
   - Remove garmindb installation from nixpacks.toml
   - Users can still register, login, and connect Garmin accounts
   - Sync feature will need to be added later

2. **Option 2**: Use a different Python package
   - Try `python39` or `python310` instead of `python3`
   - Some versions might have pip included

3. **Option 3**: Install pip differently
   - Use `python3Packages.pip` if available
   - Or install via apt-get if using Debian base

### Issue: "garmindb not found"

**Problem**: garmindb isn't installed or path is wrong.

**Solution**: 
- Check `GARMINDB_PYTHON` and `GARMINDB_CLI` environment variables
- Verify garmindb installed successfully in build logs
- Path should be: `/root/.local/bin/garmindb_cli.py`

### Issue: "Database connection failed"

**Problem**: Can't connect to Supabase.

**Solution**:
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Verify password in connection string
- Check IP restrictions in Supabase (may need to allow Railway IPs)

### Issue: "CORS error"

**Problem**: Frontend can't connect to backend.

**Solution**:
- Check `ALLOWED_ORIGINS` includes your frontend URL
- Include `https://` in URLs
- Make sure URLs match exactly
- Redeploy backend after updating CORS

## Simplifying for Initial Deployment

If you're having trouble with garmindb, you can deploy without it first:

1. **Remove garmindb from nixpacks.toml**:
   ```toml
   [phases.setup]
   nixPkgs = ["nodejs_18"]
   
   [phases.install]
   cmds = ["npm install"]
   ```

2. **Update environment variables** (remove garmindb ones):
   - Remove `GARMINDB_PYTHON`
   - Remove `GARMINDB_CLI`

3. **Deploy and test**:
   - Users can register and login ✅
   - Users can connect Garmin accounts ✅
   - Sync will show an error (expected) ⚠️

4. **Add garmindb later** once basic deployment works.

## Getting Help

- Check Railway logs for detailed error messages
- Check build logs in Railway dashboard
- Verify all environment variables are set
- Test database connection separately

