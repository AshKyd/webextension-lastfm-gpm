#!/bin/sh
VERSION=`json -f package.json version`
json -f manifests/chrome.json -e "this.version='$VERSION'" > tmp
mv tmp manifests/chrome.json
json -f manifests/firefox.json -e "this.version='$VERSION'" > tmp
mv tmp manifests/firefox.json
