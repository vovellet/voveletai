#!/bin/bash

# VoveletAI Rebranding Verification Script
# This script helps verify that the rebranding was successful

echo "📋 VoveletAI Rebranding Verification"
echo "===================================="
echo

# Check for old branding in key files
echo "🔍 Checking for remaining old branding references..."

# Count occurrences of old branding
OBSCURANET_COUNT=$(grep -r "ObscuraNet" --include="*.{ts,tsx,js,jsx,md}" . | wc -l)
OBX_COUNT=$(grep -r "OBX" --include="*.{ts,tsx,js,jsx,md}" . | wc -l)
GPT_ENGINE_COUNT=$(grep -r "GPT Engine" --include="*.{ts,tsx,js,jsx,md}" . | wc -l)
OBSCURANET_IMPORT_COUNT=$(grep -r "from '@obscuranet" --include="*.{ts,tsx,js,jsx}" . | wc -l)

echo "Found $OBSCURANET_COUNT occurrences of 'ObscuraNet'"
echo "Found $OBX_COUNT occurrences of 'OBX'"
echo "Found $GPT_ENGINE_COUNT occurrences of 'GPT Engine'"
echo "Found $OBSCURANET_IMPORT_COUNT imports from '@obscuranet'"
echo

# Check for new branding
echo "✅ Checking for new branding references..."

# Count occurrences of new branding
VOVELET_COUNT=$(grep -r "VoveletAI" --include="*.{ts,tsx,js,jsx,md}" . | wc -l)
VLET_COUNT=$(grep -r "VLET" --include="*.{ts,tsx,js,jsx,md}" . | wc -l)
LET_COUNT=$(grep -r "Let " --include="*.{ts,tsx,js,jsx,md}" . | wc -l)
VOVE_ENGINE_COUNT=$(grep -r "Vove Engine" --include="*.{ts,tsx,js,jsx,md}" . | wc -l)
VOVELET_IMPORT_COUNT=$(grep -r "from '@vovelet" --include="*.{ts,tsx,js,jsx}" . | wc -l)

echo "Found $VOVELET_COUNT occurrences of 'VoveletAI'"
echo "Found $VLET_COUNT occurrences of 'VLET'"
echo "Found $LET_COUNT occurrences of 'Let'"
echo "Found $VOVE_ENGINE_COUNT occurrences of 'Vove Engine'"
echo "Found $VOVELET_IMPORT_COUNT imports from '@vovelet'"
echo

# Check for new directories
echo "📁 Checking directory structure..."
if [ -d "packages/vove-engine" ]; then
  echo "✅ packages/vove-engine exists"
else
  echo "❌ packages/vove-engine missing"
fi

if [ -d "packages/vcore" ]; then
  echo "✅ packages/vcore exists"
else
  echo "❌ packages/vcore missing"
fi

if [ -d "__mocks__/@vovelet" ]; then
  echo "✅ __mocks__/@vovelet exists"
else
  echo "❌ __mocks__/@vovelet missing"
fi

echo
echo "📝 Next steps:"
echo "1. Run 'npm run build' to verify all files compile correctly"
echo "2. Run 'npm run test:coverage' to verify all tests pass"
echo "3. Complete any remaining renaming tasks from REBRANDING_COMPLETED.md"
echo
echo "Rebranding verification complete!"