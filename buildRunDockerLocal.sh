#!/bin/bash

echo
echo "+============================================"
echo "| START: ATLAS NEWS SEARCH LOCAL BUILD" 
echo "+============================================"
echo

datehash=`date | md5sum | cut -d" " -f1`
abbrvhash=${datehash: -8}
docker build -t newssearch:${abbrvhash} .

EXITCODE=$?

if [ $EXITCODE -eq 0 ]
    then
    source .env
    echo "Using args:"
    echo "\t${MDBCONNSTR}\n"
    echo "\t${MDB_DB}\n"
    echo "\t${PROVIDER}\n"
    echo "\t${EMBEDDING_API_KEY}\n"
    echo "\t${EMBEDDING_DIMENSIONS}\n"
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
    --restart unless-stopped    newssearch:${abbrvhash}
    echo
    echo "+================================"
    echo "| END:  ATLAS NEWS SEARCH"
    echo "+================================"
    echo
else
    echo
    echo "+================================"
    echo "| ERROR: Build failed"
    echo "+================================"
    echo
fi