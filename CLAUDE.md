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
- Leave the site's videos alone for now. They may move to Vimeo (hosted via pixelsilo.net), so don't re-encode or lazy-load them, and accept their effect on Lighthouse scores. (24 Nov 2026)
