# minecraft-server-manager

API to manange multiple minecraft servers.

It uses Docker to containerize and run multiple server instances, as well as
Postgres to keep track of servers and configurations. 

Working on backups now...

## Prerequisites

- Docker
- Docker Compose (optional but useful)

Note that this project doesn't work with Docker for Windows since it doesn't use
a `/var/run/docker.sock` file :P

If you want to run this on windows open an issue and we can address this :)

## How to run

To start:
```sh
docker-compose up
```

You can also use `docker-compsose up -d` if you want to detach from the terminal
session.

To stop:
```sh
docker-compose down
```

## How to use

... almost done the basic functionality, will update this then.

## Testing

- Run `script/start.sh` to build and start all the required containers.
- Run `script/test.sh` to test the API.
  Note that you mayyy have to kill the process with Ctrl-C since testing is
  not set up that great right now.
- Run `script/stop.sh` to clean up once you are done.
