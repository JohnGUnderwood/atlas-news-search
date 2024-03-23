#!/bin/bash
# Prompt the user to enter a repo string
echo "Please enter a docker hub repository:"
read repo
echo 
echo "Using docker hub repository ${repo}"
echo
echo "+============================================"
echo "| START: ATLAS NEWS SEARCH MULTI-ARCH BUILD"
echo "+============================================"
echo

datehash=`date | md5sum | cut -d" " -f1`
abbrvhash=${datehash: -8}

echo 
echo "Building container using tag ${abbrvhash} and buildx"
echo
docker buildx create --name newssearchbuilder --use
docker buildx build --platform linux/amd64,linux/arm64 -t ${repo}:latest -t ${repo}:${abbrvhash} --push .
docker buildx rm newssearchbuilder