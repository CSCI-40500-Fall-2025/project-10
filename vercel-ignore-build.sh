#!/bin/bash

# Ignore all automatic git-triggered builds
# Only deploy via GitHub Actions workflow after tests pass

echo "[SKIP] Automatic deployment disabled"
echo "Deployments are triggered by GitHub Actions after tests pass"
exit 0

