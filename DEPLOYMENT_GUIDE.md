# Deployment Guide - Get Your App Live! 🚀

This guide will help you deploy the Garmin Training Dashboard so your wife and brother can test it.

## Quick Deployment Options

### Option 1: Railway (Recommended - Easiest) ⭐

Railway is the easiest option with great free tier and simple setup.

**Pros:**
- Free tier: $5 credit/month
- Auto-deploys from GitHub
- Built-in PostgreSQL option
- Simple environment variable management
- Automatic HTTPS

**Steps:**
1. Push code to GitHub
2. Sign up at https://railway.app
3. Create new project → Deploy from GitHub
4. Add PostgreSQL database
5. Set environment variables
6. Deploy!

### Option 2: Render

Similar to Railway, also very easy.

**Pros:**
- Free tier available
- Auto-deploys from GitHub
- Managed PostgreSQL
- Free SSL

**Steps:**
1. Push code to GitHub
2. Sign up at https://render.com
3. Create Web Service → Connect GitHub
4. Add PostgreSQL database
5. Set environment variables
6. Deploy!

## What We'll Deploy

- **Backend**: Express.js API (Node.js)
- **Frontend**: React app (static build)
- **Database**: Supabase (already set up!)

## Deployment Checklist

### Pre-Deployment

- [ ] Code is pushed to GitHub
- [ ] Supabase database is set up
- [ ] Environment variables documented
- [ ] Production build tested locally

### Deployment Steps

- [ ] Choose hosting platform (Railway/Render)
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Configure environment variables
- [ ] Test production deployment
- [ ] Share URL with testers!

## Estimated Time

- **Railway**: 30-60 minutes
- **Render**: 45-90 minutes

Let's get started! 🎉

