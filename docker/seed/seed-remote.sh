#!/usr/bin/env sh
#
# Seed the students collection on the Typesense dev-server with demo data
#

# Set the Typesense host and API key
TYPESENSE_HOST="https://toolbox-backend-dev.tugraz.at"
TYPESENSE_COLLECTION="cabinet-students"

# Check if TYPESENSE_API_KEY is set
if [ -z "$TYPESENSE_API_KEY" ]; then
  echo "Please set the TYPESENSE_API_KEY environment variable"
  exit 1
fi

## Generate search-only API key
#printf "Creating search-only API key for ${TYPESENSE_COLLECTION} collection...\n\n"
#curl "${TYPESENSE_HOST}/keys" \
#    -X POST \
#    -H "X-TYPESENSE-API-KEY: ${TYPESENSE_API_KEY}" \
#    -H 'Content-Type: application/json' \
#    -d '{"description":"Search-only companies key.","actions": ["documents:search"], "collections": ["cabinet-students"]}'

printf "Deleting the ${TYPESENSE_COLLECTION} collection...\n\n"

curl -X DELETE "${TYPESENSE_HOST}/collections/${TYPESENSE_COLLECTION}" \
     -H 'Content-Type: application/json' \
     -H "X-TYPESENSE-API-KEY: ${TYPESENSE_API_KEY}"

printf "\n\nCreating the ${TYPESENSE_COLLECTION} collection...\n\n"

curl -X POST "${TYPESENSE_HOST}/collections" \
    -H 'Content-Type: application/json' \
    -H "X-TYPESENSE-API-KEY: ${TYPESENSE_API_KEY}" \
    -d '{
  "name": "cabinet-students",
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
