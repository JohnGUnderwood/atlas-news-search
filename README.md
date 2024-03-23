# Atlas News Search
This is the search app that goes with the [Atlas RSS Crawler](https://github.com/JohnGUnderwood/atlas-rss-crawler)

# How can I run it?
First you will need to set your database connection string and optional database name (defaults to 'news-demo') in `.env`. There is an example of how to name your variables in [`example.env`](./example.env). Also add API keys for the embedding service.

After that you can either install everything to a local environment or use docker.

Once everything is running you can access the frontend at http://localhost:3000/

## Local Install
```
./runLocal.sh
```
Runs the npm `build` and `start` commands.

## Docker

### Pull: Docker container from public repo
```
./runDocker.sh
```

This pulls the latest image hosted at [johnunderwood197/newssearch](https://hub.docker.com/r/johnunderwood197/newssearch) and runs it locally in a container. This uses `docker pull` which should automatically pull the correct image for your architecture (amd64 or arm64).

### Build: Docker image and run container locally.
```
./buildRunDockerLocal.sh
```

Will build a docker image and then run it in a local container.

### Publish: build and push multi-arch images to your docker repository
```
./buildAndPush.sh
```

This creates multi-arch images (linux/amd64 and linux/arm64) and pushes them to a repo of your choice. Due to some architecture-dependant binaries this project makes use of [docker's ability to build for multiple architectures](https://docs.docker.com/build/building/multi-platform/#cross-compilation).