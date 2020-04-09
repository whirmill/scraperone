# Setup

Ensure that index.js has got execution permission, if not, run `chmod +x ./scraperone`

# Run

`./scraperone <data-source> [selector]` or `node index.js <data-source> [selector]`

For example: `./scraperone ./datasource.json 'a[href*="mailto:"]'`

# Check result

open `.tmp/out.json`
