HSL Map Publisher
====================

### Dependencies

Install dependencies:

```
yarn
```

Install `pdftk`

### App

Server for creating HSL stop posters. Uses React to render the posters, and a PostgreSQL database to save builds. Use the [publisher-ui](https://github.com/HSLdevcom/hsl-map-publisher-ui) project to control the server.

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

Adjust the port if you have many Postgres instances running on your machine. The server needs the `PG_CONNECTION_STRING` environment variable set, which it uses to connect to your Postgres instance. If you use the default Postgres port, it looks like this:

```bash
PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/postgres
```

Again, adjust the port if you are running yoir Publisher Postgres instance in an other port.

Start the Publisher server, prepending the Postgres connection string:
```bash
PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/postgres npm run server:hot
```

That command will run a Forever instance that watches for changes and restarts the server when they happen.

Alternatively, to run the server with plain Node, leave off `hot`:
```bash
PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/postgres npm run server
```

The React app needs to be run separately:
```bash
npm start
```

Now you can use the UI with the server, or open a poster separately in yor browser. The poster app needs `component` and `props` query parameters, and the server will echo the currently rendering URL in its console. But if you just need to open the poster app, you can use this link that will show H0454, Snellmaninkatu:

`http://localhost:5000/?component=StopPoster&props%5BstopId%5D=1010124&props%5Bdate%5D=2018-09-13&props%5BisSummerTimetable%5D=false&props%5BdateBegin%5D=&props%5BdateEnd%5D=&props%5BprintTimetablesAsA4%5D=false&props%5BprintTimetablesAsGreyscale%5D=false&template=mock_template`

Note that the template name doesn't matter when opening the URL outside of Puppeteer, as it will fall back to a mock template.

### Running in Docker

Start a Postgres Docker container:
```
docker run -d --name publisher-postgres -e POSTGRES_PASSWORD=postgres postgres
```

Build and start the container:
```
docker build -t hsl-map-publisher .
docker run -d -p 4000:4000 --name publisher -v $(pwd)/output:/output -v $(pwd)/fonts:/fonts --link publisher-postgres -e "PG_CONNECTION_STRING=postgres://postgres:postgres@publisher-postgres:5432/postgres" --shm-size=1G hsl-map-publisher
```

where `fonts` is a directory containing `Gotham Rounded` and `Gotham XNarrow` OpenType fonts.
