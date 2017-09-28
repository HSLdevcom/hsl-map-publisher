
Route map
====================

Use ImageMagick to create a tileset:
```
convert 35000.png -crop 1024x1024 \
    -set filename:tile "%[fx:page.x/1024+1]_%[fx:page.y/1024+1]" \
    +repage +adjoin "35000/%[filename:tile].png"
```

Create a JSON file containing the following properties:
```
{
    "top": 8506226.10604208,
    "left": 2712353.539647764,
    "metersPerPixel": 3.36263561649125,
    "url": "http://localhost:8080/35000/{x}_{y}.png",
    "tileSize": 1024,
    "rows": 28,
    "columns": 28,
    "dpi": 300
}
```

Pass its URL as a prop to the route map component along with other props.
