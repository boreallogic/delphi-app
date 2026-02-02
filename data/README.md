# Indicator Data Management

This folder contains the source files for indicator data. Edit these files to update the app's indicators.

## Files

### `indicators_revised_v2.xlsx` (Primary)
The main source of truth for indicator structure:
- **Columns**: ID, Category, Indicator Name, Definition, Definition_Plain, Unit of Measure, Operationalization, Collection Frequency, Priority, Notes/Edge Cases, Domain_Original, Domain_Code, Domain_Name, Domain_Question, Tier, Tier_Rationale, Data_Reliability, MVP
- **Sheets**: `All_Indicators` (73 indicators), `MVP_Indicators` (29 priority indicators)

Edit this file for:
- Adding/removing indicators
- Changing indicator definitions
- Updating tier assignments
- Modifying MVP status
- Adjusting domain groupings

### `indicator_evidence_v2.json` (Enrichment)
Evidence base that enriches indicators with research backing:
- `evidence_summary`: Brief description of research support
- `risk_factors`: Array of risk factors with citations
- `protective_factors`: Array of protective factors with citations
- `key_citations`: Array of source references
- `thresholds`: Object with adequate/partial/major_gap/critical thresholds
- `baseline_category`: community_specific | territorial | distance_modified
- `rrn_relevance`: CRITICAL | HIGH | MEDIUM | LOW

Edit this file for:
- Adding research evidence
- Updating citations
- Defining thresholds
- Adding risk/protective factors

## Workflow

### 1. Edit source files
Make changes to the Excel and/or JSON files as needed.

### 2. Preview changes (dry run)
```bash
npm run import:dry-run
```
This shows what will be imported without making changes.

### 3. Import to database
```bash
npm run import
```
This replaces all indicators in the database with the merged data.

## Data Merge Logic

The import script merges data with Excel as primary:

| Field | Source |
|-------|--------|
| ID, Name, Definition | Excel |
| Unit, Frequency, Operationalization | Excel |
| Domain info | Excel |
| Tier, MVP, Reliability | Excel (with JSON fallback) |
| Evidence summary | JSON |
| Risk/protective factors | JSON |
| Citations | JSON |
| Thresholds | JSON |

If an indicator exists in Excel but not JSON, it imports without evidence data.
If a field exists in both, Excel takes precedence (except evidence-specific fields).

## Tips

- Keep indicator IDs consistent between Excel and JSON (e.g., "SH01", "CC03")
- The MVP column in Excel accepts: "Yes", "yes", "true", "TRUE"
- Domain codes should be single letters: A, B, C, D, E, F, G, H
- After importing, restart the dev server to see changes
