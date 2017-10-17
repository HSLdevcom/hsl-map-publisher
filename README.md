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

```
docker build -t hsl-map-publisher .
docker run -d -p 5000:5000 -v output:/output -v fonts:/fonts hsl-map-publisher
```

where `fonts` is a directory containing `Gotham Rounded` and `Gotham XNarrow` OpenType fonts.

Open [http://localhost:5000](http://localhost:5000)
