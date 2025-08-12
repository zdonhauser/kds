#!/bin/bash
# Temporarily move parent yarn.lock and run dev server
if [ -f "../yarn.lock" ]; then
    mv ../yarn.lock ../yarn.lock.bak
    echo "Moved parent yarn.lock temporarily"
fi

npm run dev

# Restore yarn.lock when done
if [ -f "../yarn.lock.bak" ]; then
    mv ../yarn.lock.bak ../yarn.lock
    echo "Restored parent yarn.lock"
fi