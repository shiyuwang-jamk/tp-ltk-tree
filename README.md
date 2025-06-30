# tp-ltk-tree

This repo deals with coding correspondence in the proprietary Finnish platform Terveysportti (health portal) for medicines.

## This repo contains:
- Several Node.js scraper scripts collecting source data.
- One Python script joining the indexes.
- A result of the scraped data.

## Products of the Repo:

### `tdoi-drg.csv`
### `tree-api-with-tdoi.csv`

You can import the files to Excel and explore yourself.

## Potentials of the Repo:
1. Access the drugs and groups quickly with the number-only code for DRG shorthand URL
2. Search with the DRG code in Duodecim's Finnish doctor's manual (lääkärin käsikirja, YTK) to find articles where the same drug or drug group appears.
3. TODO Find out drugs belonging to multiple drug categories.

## The scripts

### tp-drg-doi-node.js

The script first prompts a user for access key string from browser cookie, then queries final links of around 1700 short URLs (Terveysportti DOIs or TDOIs) in the form of

>     https://www.terveysportti.fi/doi/drg*****
      
***** being a 5-digit code running from 00001 to 11233, after which all code should return 404 as in June 2025.

These URLs (DRGs) have been found in Duodecim's doctor's manual (lääkärin käsikirja, YTK), which can be accessed via similar shorthand URL form

>     https://www.terveysportti.fi/doi/ytk*****

Note: YTK's English counterpart, Evidence-Based Medicine Guidelines (EBMG), uses instead ATC code pointing to ATC/DDD website in its entries.

If the DRG number code is valid, the link would redirect to a URL of Duodecim's medicine database (lääketietokanta, LTK) in the form of:

>     https://www.terveysportti.fi/apps/laake/laakeryhma/XXXXXXX

XXXXXXX being either an ATC code to a specific substance name or a proprietary coding system in LTK (lääkeryhmä) categorizing medicines with slight derivations from the ATC system.

With the code in the redirected URL, the script then
- In the case of an ATC code, fetches the English and Finnish names
- In the case of a LTK group code, fetches the descriptive Finnish text of the group

Then the script also finds the upper group name of the substance or group behind the code.

The script fetches data through:
- LTK's API fetching a JSON containing Finnish name and groups with the access key string from browser cookie.
- English drug name from the ATC/DDD website by parsing its webpage with the ATC code.

Then the script writes the results into a CSV file with one DRG code per line. A sample of the results can be found at file `./tdoi-drg.csv`


### tree-api.js

As an extension and complement to the drg-doi script, this script inspects tree structure found at the right column of the LTK page top-down, with a total of 2929 nodes, of which 551 were categories, leaving 2378 drug substances, around % of the whole ATC/DDD as of June 2025.

Via the same LTK API, the script recursively "expands" the LTK medicine tree like clicking the tree nodes on the website, then check for possible TDOIs and English names in `./tdoi-drg.csv` and fetch additional English names again at ATC/DDD.

### tree-tdoi-fill.py

This script joins results from the Node.js scripts and generates the final product `tree-api-with-tdoi.csv`.