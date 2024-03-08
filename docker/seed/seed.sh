#!/usr/bin/env sh
#
# Seed the students collection in Typesense with demo data
#

# Set the Typesense host and API key
TYPESENSE_HOST="http://typesense.localhost:9100"
TYPESENSE_API_KEY="xyz"
TYPESENSE_COLLECTION="students"

printf "Deleting the students collection...\n\n"

curl -X DELETE "${TYPESENSE_HOST}/collections/${TYPESENSE_COLLECTION}" \
     -H 'Content-Type: application/json' \
     -H "X-TYPESENSE-API-KEY: ${TYPESENSE_API_KEY}"

printf "\n\nCreating the ${TYPESENSE_COLLECTION} collection...\n\n"

curl -X POST "${TYPESENSE_HOST}/collections" \
    -H 'Content-Type: application/json' \
    -H "X-TYPESENSE-API-KEY: ${TYPESENSE_API_KEY}" \
    -d '{
  "name": students,
  "fields": [
    {"name": "student_id", "type": "string" },
    {"name": "name", "type": "string" },
    {"name": "age", "type": "int32" },
    {"name": "grade", "type": "string" },
    {"name": "subjects", "type": "string[]"}
  ],
  "default_sorting_field": "age"
}'

printf "\n\nImporting ${TYPESENSE_COLLECTION} data...\n\n"

curl -X POST "${TYPESENSE_HOST}/collections/${TYPESENSE_COLLECTION}/documents/import" \
     -H 'Content-Type: application/json' \
     -H "X-TYPESENSE-API-KEY: ${TYPESENSE_API_KEY}" \
     --data-binary '@students.jsonl'
