HSL Map Publisher
====================

### Dependencies

Install dependencies:

```
yarn
```

Install `pdftk`

### App

React app and components for HSL stop posters

Start development server:
```
yarn start:hot
```

Open [http://localhost:5000/?component=StopPoster&props={"stopId": "1284117", "date": "2018-01-15"}](http://localhost:5000/?component=StopPoster&props={%22stopId%22:%221284117%22,%22date%22:%222018-01-15%22})

### Writing components

- Write CSS styles @ 72 dpi (i.e. 72 pixels will be 25.4 mm)
- Add components to `renderQueue` for async tasks (PDF is generated when `renderQueue` is empty)
- Use SVG files with unique IDs and no style tags (Illustrator exports)

### Server

Server and REST API for printing components to PDF files and managing their metadata in a Postgres database.

Start Postgres:
```
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres
```

Start server:
```
PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/postgres yarn server
```

### Running in Docker

Start a Postgres Docker container:
```
docker run -d --name publisher-postgres -e POSTGRES_PASSWORD=postgres postgres
```

Build and start the container:
```
docker build -t hsl-map-publisher .
docker run -d -p 4000:4000 -v $(pwd)/output:/output -v $(pwd)/fonts:/fonts --link publisher-postgres -e "PG_CONNECTION_STRING=postgres://postgres:postgres@publisher-postgres:5432/postgres" --shm-size=1G hsl-map-publisher
docker run -d -p 4000:4000 -v $(pwd)/output:/output -v $(pwd)/fonts:/fonts --link publisher-postgres -e "PG_CONNECTION_STRING=postgres://postgres:postgres@publisher-postgres:5432/postgres" --shm-size=1G hsldevcom/hsl-map-publisher
```

where `fonts` is a directory containing `Gotham Rounded` and `Gotham XNarrow` OpenType fonts.
