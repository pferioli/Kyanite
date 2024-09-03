#/usr/local/bin/cloud_sql_proxy --instances=kyanite-aaii:southamerica-east1:kyanite=tcp:3306 --json-credentials "./credentials/kyanite-aaii-00ab4e22614e.json" --dir "/cloudsql"

# gcloud sql instances describe kyanite-aaii:southamerica-east1:kyanite --format='value(connectionName)'

/usr/local/bin/cloud_sql_proxy --address 0.0.0.0 --port 3306 --credentials-file "/Users/pabloferioli/Projects/kyanite/credentials/kyanite-aaii-00ab4e22614e.json" kyanite-aaii:southamerica-east1:kyanite