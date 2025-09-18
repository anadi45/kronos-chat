#!/bin/bash

# Script to serve the client with fresh builds (no cache)
# This ensures that nx serve client always does a new build instead of using Vite cache

echo "🧹 Cleaning caches and starting fresh build..."
echo ""

# Clean all caches
echo "1. Cleaning NX cache..."
nx reset

echo "2. Cleaning Vite cache..."
rm -rf node_modules/.vite
rm -rf dist/apps/client

echo "3. Starting client with fresh build..."
echo "   - Using --skip-nx-cache to bypass NX cache"
echo "   - Using --buildLibsFromSource to read libraries from source"
echo ""

# Start the client with fresh build options
nx serve client --skip-nx-cache --buildLibsFromSource

echo ""
echo "✅ Client started with fresh build (no cache)"
