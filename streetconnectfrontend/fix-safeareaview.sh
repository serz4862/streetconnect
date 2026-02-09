#!/bin/bash

echo "🔧 Fixing SafeAreaView deprecation warnings..."
echo ""

cd /Users/sauravkumar/Desktop/Streetconnect/streetconnectfrontend

# Find all files with SafeAreaView
files=$(grep -rl "from 'react-native'" app | grep -E "\.(tsx|ts)$" | xargs grep -l "SafeAreaView")

for file in $files; do
  echo "Fixing: $file"
  
  # Check if file imports SafeAreaView from react-native
  if grep -q "SafeAreaView" "$file" && grep -q "from 'react-native'" "$file"; then
    # Remove SafeAreaView from react-native import
    sed -i '' "s/SafeAreaView,//g" "$file"
    sed -i '' "s/,SafeAreaView//g" "$file"
    sed -i '' "s/{ SafeAreaView }/{ }/g" "$file"
    
    # Add import from react-native-safe-area-context if not already there
    if ! grep -q "from 'react-native-safe-area-context'" "$file"; then
      # Add new import after react-native import
      sed -i '' "/from 'react-native';/a\\
import { SafeAreaView } from 'react-native-safe-area-context';
" "$file"
    fi
  fi
done

echo ""
echo "✅ Fixed all SafeAreaView imports!"
echo "Files updated: $(echo "$files" | wc -l | xargs)"
