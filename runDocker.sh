#!/bin/bash
source .env
echo "Using args:"
echo "\t${MDBCONNSTR}\n"
echo "\t${MDB_DB}\n"
echo "\t${PROVIDER}\n"
echo "\t${API_KEY}\n"
echo
echo "Pulling docker image from johnunderwood197/newssearch:latest"
docker pull johnunderwood197/newssearch:latest
echo 
echo "Starting container"
echo
docker stop newssearch
docker rm newssearch
docker run -t -i -d -p 3000:3000 -p 3010:3010 --name newssearch \
-e "MDBCONNSTR=${MDBCONNSTR}" \
-e "MDB_DB=${MDB_DB}" \
-e "OPENAIAPIKEY=${API_KEY}" \
-e "PROVIDER=${PROVIDER}" \
--restart unless-stopped johnunderwood197/newssearch:latest