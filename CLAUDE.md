# Exclusive Residential

Pixel Silo client folder. Jobs here come from the Adapt dashboard and follow the `adapt-job` skill.

## Client

- Dashboard: `exclusive-residential`, https://dashboard.pixelsilo.net/studio/w/exclusive-residential
- Live: not set yet (the holding page at excl.group is a separate Webflow site)
- Staging: https://exclgroup.webflow.io
- Webflow: site `6a68dfaeda21c862740b9dd3` ("Exclusive Construction Group"), through the `webflow-pixelsilo` connection

## Code

Custom JS lives in this repo (github.com/pixelsilo/exclusive-residential). Follow the `webflow-custom-code` skill for how it's built and released.

## Writing

Anything drafted for Luke to send (client messages, questions, approval messages) follows the `writing-guide` skill, not `pixel-silo-brand`.

## How we work

Notes from Luke's corrections, added as we go. Read before starting a job.

- The brand is **Exclusive Construction Group** and nothing else. "Exclusive Residential Group" is an old name, so remove it wherever it appears. The disciplines are Residential, Projects (commercial work) and Aftercare. The legal entity in the footer is Exclusive Residential Ltd (company no. 09421240); use it only as `legalName` in schema. (24 Nov 2026)
- Videos are served from Cloudflare R2 (not Vimeo), with separate desktop and mobile encodes at better quality than Webflow's. Hosting is expected to be free; if usage grows it may cost about $5/month, charged back to the client. (Call with Tim, 25 Nov 2026)
  - Set up 25 Nov 2026 in Luke's Cloudflare account. Bucket `exclusive-construction-group`, files under `videos/v1/{desktop,mobile,poster}/`. They're served by the `ecg-media` Worker (`worker/`) at https://ecg-media.luke-3d8.workers.dev, because excl.group's DNS is with Digitum, not Cloudflare.
  - The inline head script (`snippets/video-r2.html`) swaps the Webflow video URLs to R2 as the page is parsed: mobile at 767px and below, desktop above. Webflow still holds the originals, so removing the head script reverts it.
  - Source and encoded files are in `D:\exclusive-residential\01-site-videos`. A new video needs encoding, uploading, and an entry in the script's map.
- Tim (tim@digitum.co.uk, Digitum) is the contact for this site. The footer needs a small "Site by Digitum" credit linking to his site. (25 Nov 2026)
