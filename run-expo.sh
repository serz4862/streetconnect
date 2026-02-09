#!/usr/bin/env bash
# One-command startup for Expo Go

cd "$(dirname "$0")/frontend"
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.2 npx expo start --clear
