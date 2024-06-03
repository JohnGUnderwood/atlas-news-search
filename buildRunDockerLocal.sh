#!/bin/bash

echo
echo "+============================================"
echo "| START: ATLAS NEWS SEARCH LOCAL BUILD" 
echo "+============================================"
echo

datehash=`date | md5sum | cut -d" " -f1`
abbrvhash=${datehash: -8}
docker build -t newssearch:latest .

EXITCODE=$?

if [ $EXITCODE -eq 0 ]
    then
PROVIDER
OPENAI_KEY
    source .env
    echo "Using args:"
    echo "\t${MDBCONNSTR}\n"
    echo "\t${MDB_DB}\n"
    echo "\t${PROVIDER}\n"
    echo "\t${OPENAIAPIKEY}\n"
    echo 
    echo "Starting container"
    echo
    docker stop newssearch
    docker rm rnewssearch
    docker run -t -i -d -p 3000:3000 -p 3010:3010 --name newssearch \
    -e "MDBCONNSTR=${MDBCONNSTR}" \
    -e "MDB_DB=${MDB_DB}" \
    -e "OPENAIAPIKEY=${OPENAIAPIKEY}" \
    -e "PROVIDER=${PROVIDER}" \
    --restart unless-stopped    newsearch:latest
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
