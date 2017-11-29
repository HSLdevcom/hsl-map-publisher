HSL Map Publisher
====================

### Installation

Install dependencies:

```
yarn install
```

### Development

Start development server:
```
npm run start:hot
```

Open [http://localhost:3000/component=StopPoster&props={"stopId": "1284117", "date": "2017-05-15"}](http://localhost:3000/component%3DStopPoster%26props%3D%7B%22stopId%22%3A%20%221284117%22%2C%20%22date%22%3A%20%222017-05-15%22%7D)

### Running in Docker

Start a postgres docker container:
```
docker run -d --name publisher-postgres -e POSTGRES_PASSWORD=mysecretpassword postgres
```

Build and start the container:
```
docker build -t hsl-map-publisher .
docker run -d -p 4000:4000 -v output:/output -v fonts:/fonts --link publisher-postgres -e "PG_CONNECTION_STRING=postgres://postgres:mysecretpassword@publisher-postgres:5432/postgres" --shm-size=1G hsl-map-publisher
```

where `fonts` is a directory containing `Gotham Rounded` and `Gotham XNarrow` OpenType fonts.
