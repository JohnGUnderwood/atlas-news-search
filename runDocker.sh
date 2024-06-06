#!/bin/bash
echo "Please enter an image tag:"
read tag
source .env
echo "Using args:"
echo "\t${MDBCONNSTR}\n"
echo "\t${MDB_DB}\n"
echo "\t${PROVIDER}\n"
echo "\t${EMBEDDING_API_KEY}\n"
echo "\t${EMBEDDING_DIMENSIONS}\n"
echo
echo "Pulling docker image from johnunderwood197/newssearch:${tag}"
docker pull johnunderwood197/newssearch:${tag}
echo 
echo "Starting container"
echo
docker stop newssearch
docker rm newssearch
docker run -t -i -d -p 3000:3000 -p 3010:3010 --name newssearch \
    -e "MDBCONNSTR=${MDBCONNSTR}" \
    -e "MDB_DB=${MDB_DB}" \
    -e "PROVIDER=${PROVIDER}" \
    -e "EMBEDDING_API_KEY=${EMBEDDING_API_KEY}" \
    -e "EMBEDDING_DIMENSIONS=${EMBEDDING_DIMENSIONS}" \
    --restart unless-stopped johnunderwood197/newssearch:${tag}