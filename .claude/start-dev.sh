#!/bin/sh
export PATH="/Users/eugene.gusakov/.nvm/versions/node/v22.19.0/bin:$PATH"
cd /Users/eugene.gusakov/Documents/self-projects/ShipReady
exec node node_modules/.bin/next dev --port 3000
