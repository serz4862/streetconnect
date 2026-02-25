#!/bin/bash
# Fix Excitel ISP DNS hijacking for Supabase
# Run: bash fix-dns.sh (requires your Mac password once)

HOST="jqgemewsbmwhckajxjkn.supabase.co"
IP1="104.18.38.10"
IP2="172.64.149.246"

echo "🔧 Adding Supabase hosts entries to /etc/hosts..."

if grep -q "$HOST" /etc/hosts; then
  echo "✅ Entry already exists in /etc/hosts"
else
  echo "$IP1 $HOST" | sudo tee -a /etc/hosts > /dev/null
  echo "$IP2 $HOST" | sudo tee -a /etc/hosts > /dev/null
  echo "✅ Added. Flushing DNS cache..."
  sudo dscacheutil -flushcache 2>/dev/null
  sudo killall -HUP mDNSResponder 2>/dev/null
fi

echo ""
echo "✅ Done. Supabase should now be reachable."
echo "   Test: curl -s https://$HOST/rest/v1/ | head -1"
