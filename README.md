# HSL Map Publisher (Julistegeneraattori)

This project is the server-side component of the poster publisher (the UI can be found in [HSLdevcom/hsl-map-publisher-ui](https://github.com/HSLdevcom/hsl-map-publisher-ui)) that generates the stop posters that you see on public transport stops around the Helsinki area. It uses PostgreSQL as the database where the poster data and generation status is stored, React for rendering the posters, Puppeteer for generating PDF's of the poster app and Koa as the server to tie everything together.

In production everything runs from a docker container that takes care of all dependencies and environment setup.

### Dependencies

Install dependencies:

```
yarn
```

Install `pdftk`. It should be present in your system's package manager (Use Homebrew on Mac).

### About the app

This project is split in two parts. The first is a server that receives the poster requests and fires up a Puppeteer instance which runs a React app that renders the posters. This component lives in the `scripts` directory. The other part is the React app itself which lives in the `src` directory. It is a more complicated app, as it needs to load data from both the publisher database as well as from the JORE database.

### Writing components

- Write CSS styles @ 72 dpi (i.e. 72 pixels will be 25.4 mm)
- Add components to `renderQueue` for async tasks (PDF is generated when `renderQueue` is empty)
- Use SVG files with unique IDs and no style tags (Illustrator exports)

### Layout logic

The poster app will try to fit all pieces of the poster in the allotted area, and will drop off or modify the layout as required. This logic is programmed in the `StopPoster` component's `updateLayout` method. The order is as follows:

1. Make the route box full-width
2. Hide the route box
3. Stretch the timetable column to be full-width
4. Hide the tram or route diagram
5. Hide the local map (or static SVG image)

It will make two layout passes to check if the map can be rendered. The ads (graphics under the timetable column) will be shown if there is enough space left over under the timetables. They are not included in the logic chain described above.

Each component will add itself to the "render queue" when mounted, an operation of which there are multiple examples in the code. Once the component has finished its own data fetching and layout procedures it removes itself from the render queue. Once the render queue is empty, the poster is deemed finished and the server will instruct Puppeteer to create a PDF of the page. The component can also pass an error when removing itself which triggers the whole poster to fail.

### Running the app

Server and REST API for printing components to PDF files and managing their metadata in a Postgres database.

#### 1. Start Postgres

```
docker run -p 0.0.0.0:5432:5432 --env POSTGRES_PASSWORD=postgres --name publisher-postgres postgres
```

Adjust the port if you have many Postgres instances running on your machine. The server needs the `PG_CONNECTION_STRING` environment variable set, which it uses to connect to your Postgres instance. If you use the default Postgres port, place this to `.env`:

```
PG_CONNECTION_STRING=postgres://postgres:postgres@localhost:5432/postgres
```

Again, adjust the port if you are running your Publisher Postgres instance on an other port.

#### 2. Redis

Start Redis
```
docker run --name redis --rm -p 6379:6379 -d redis
```

For default configuration, place the following to `.env`:
```
REDIS_CONNECTION_STRING=redis://localhost:6379
```

#### 3. Backend, worker and poster UI

In development, start the Publisher backend server like this, (make sure you have connection strings in `.env`)
```bash
yarn run server:hot
```

That command will run a Forever instance that watches for changes and restarts the server when they happen.

Alternatively, to run the server with plain Node, leave off `hot`:
```bash
yarn run server
```

Then, start generator worker. (You can start multiple workers.)
```
yarn worker
```

Finally, start the React app
```bash
yarn start
```

Now you can use the UI with the server, or open a poster separately in your browser. The poster app needs `component` and `props` query parameters, and the server will echo the currently rendering URL in its console. But if you just need to open the poster app, you can use this link that will show H0454, Snellmaninkatu:

`http://localhost:5000/?component=StopPoster&props%5BstopId%5D=1140196&props%5Bdate%5D=2019-09-30&props%5BisSummerTimetable%5D=true&props%5BdateBegin%5D=&props%5BdateEnd%5D=&props%5BprintTimetablesAsA4%5D=false&props%5BprintTimetablesAsGreyscale%5D=false&template=mock_template`

You will have to create a template using the Publisher UI. The poster app will download the template from the Publisher server.

If Azure credentials are not set in the .env file the posters will be stored locally.

#### 4. Start frontend

See [hsl-map-publisher-ui](https://github.com/HSLdevcom/hsl-map-publisher-ui) for UI.

### Running in local Docker

As before, make sure you are running a database and broker for the publisher:

```bash
docker run -p 0.0.0.0:5432:5432 --env POSTGRES_PASSWORD=postgres --name publisher-postgres postgres
docker run --name redis --rm -p 6379:6379 -d redis
```
Remember to check the naming of the containers! If they are different, use your naming in `.env.local` and in next commands. Add also possible credentials to connection strings, if you have set up them.

Create `fonts/` -directory inside project folder. Place `Gotham Rounded` and `Gotham XNarrow` OpenType fonts there from Azure. Due to licensing, we cannot include the fonts in the repository.
If you cannot access fonts, remember to use `NO_FONTS=true` variable later on.


Build the Docker image with the following command:

```bash
docker build --build-arg BUILD_ENV=local -t hsl-map-publisher .
```

And run the Docker container with this command:

```bash
docker run -d -p 4000:4000 --name publisher -v $(pwd)/output:/output -v $(pwd)/fonts:/fonts --link publisher-postgres --link redis hsl-map-publisher
```

If you don't have local fonts or Azure credentials, run with variable:

```bash
docker run -d -p 4000:4000 --name publisher -v $(pwd)/output:/output -v $(pwd)/fonts/:/fonts --link publisher-postgres --link redis -e "NO_FONTS=true" hsl-map-publisher
```