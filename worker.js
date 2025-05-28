console.log('worker started')
importScripts('https://maker.js.org/target/js/browser.maker.js')
const makerjs = require('makerjs');

let cell = 0.81; // inch
let margin = cell / 8; // inch
let corner = cell / 8;
// http://www.bartneck.de/2019/04/21/lego-brick-dimensions-and-measurements/
const legoUnit = 1.6; // mm
const legoGap = 0.2; // mm
const legoSide = 10 * legoUnit; // mm
const legoHoleRadius = 2.4; // mm

const palette = [
  0x000000,
  0xffffff,
  0xff2121,
  0xff93c4,
  0xff8135,
  0xfff609,
  0x249ca3,
  0x78dc52,
  0x003fad,
  0x87f2ff,
  0x8e2ec4,
  0xa4839f,
  0x5c406c,
  0xe5cdc4,
  0x91463d,
  0x000000
];
const legoPalette = [
     0x000000
    ,0xffffff
    ,0xff0000
    ,0xEE9DC3
    ,0xff6600
    ,0xF7CE46
    ,0x478CC6
    ,0x00cc00
    ,0x0000ff
    ,0x68c3e2
    ,0x990066
    ,0xa06eb9
    ,0xcda4de
    ,0xF5C189
    ,0xA83D15
    ,0x000000
]
const paletteNames = [
  "black",
  "white",
  "red",
  "fushia",
  "orange",
  "yellow",
  "olive",
  "green",
  "blue",
  "teal",
  "purple",
  "aqua",
  "wine",
  "gray",
  "maroon",
  "black"
]

function floodFill(img, width, height) {
  const pixels = []
  for (let y = 0; y < height; ++y) {
    for(let x = 0; x < width; ++x) {
      const k = y * width + x;
      const c = img[k];
      pixels.push({ x, y, k, c, w: x + y, done: false })
    }
  }

  const todo = pixels.slice(0);
  todo.sort((l,r) => l.w-r.w);
  const groups = [];

  while(todo.length) {
    // find next root, closest to the upper left
    const root = todo.shift();
    if (root.done) continue; // already visited
    if (root.c === 0) continue; // transparent color

    // is the previous group the same color?
    const lastGroup = groups[groups.length -1]
    let group;
    if (lastGroup && lastGroup.c === root.c)
      group = lastGroup;
    else {
        group = {
        c: root.c,
        points: []
      };
      groups.push(group)
    }
    // fill
    const flood = [root];
    while(flood.length) {
      const next = flood.pop();
      if (next.done) continue;

      next.done = true;
      group.points.push(next);
      // scan neighbors and add to todo list
      [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]].forEach(([dx,dy]) => {
          const pixel = get(next.x + dx, next.y + dy);
          //console.log({ pixel, x: next.x + dx, y: next.y + dy })
          if (pixel && !pixel.done) {
            if (pixel.c === root.c) {
              flood.push(pixel);
            } else {
              // schedule
              todo.splice(todo.indexOf(pixel), 1)
              todo.push(pixel)
            }
          }
      })
    }
  }

  // console.log({ groups })

  function get(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height)
        return undefined;
    const k = y * width + x;
    return pixels[k];
  }

  return groups;
}

function rect(x, y, w, h) {
  const m = new makerjs.models.Rectangle(w, h);
  m.origin = [x,y];
  return m;
}

function rrect(x, y, w, h) {
  const m = new makerjs.models.RoundRectangle(w, h, corner);
  m.origin = [x,y];
  return m;
}

function outerboxLEGO(width, height) {
  const boxWidth =  width * legoSide;
  const boxHeight = height * legoSide;
  return { w: boxWidth, h: boxHeight };
}


function outerbox(width, height) {
  const boxWidth = 2* cell /*padding*/ + width * cell /* boxes*/ + (width - 1) * margin;
  const boxHeight = 2* cell /*padding*/ + height * cell /* boxes*/ + (height - 1) * margin;
  return { w: boxWidth, h: boxHeight };
}

function renderSvg(img, width, height, pal) {
  const bb = outerbox(width, height);
  const ppi = Math.min(300, Math.min(4096 / bb.w, 4096 / bb.h));

  let svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="${bb.w * ppi}" height="${bb.h * ppi}" viewBox="0 0 ${bb.w * ppi} ${bb.h * ppi}">\n`;

  for(let i = 0; i < width; ++i) {
    let x = (cell + i * (cell + margin));
    for (let j = 0; j < height; ++j) {
      const ci = img[j * width + i];
      if (ci == 0) continue;
      const c = (pal || palette)[ci];
      let y = (cell + j * (cell + margin));

      svg += `<rect x="${x * ppi}" y="${y * ppi}" width="${cell * ppi}" height="${cell * ppi}" rx="${corner * ppi}" class="cell" style="fill: #${c.toString(16)}" />\n`
    }
  }

  svg += `</svg>`;
  //console.log(svg)

  return svg;
}

function renderBeads(img, width, height, pal) {

  const cell = 5; // mm
  const bb = {
    w: 1 * cell /*padding*/ + width * cell /* boxes*/,
    h: 1 * cell /*padding*/ + height * cell /* boxes*/
  }

  let svg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
width="${bb.w}mm" height="${bb.h}mm" viewBox="0 0 ${bb.w} ${bb.h}" style="background-color:white">\n`;

  for(let i = 0; i < width; ++i) {
    const x = (cell + i * (cell));
    for (let j = 0; j < height; ++j) {
      const ci = img[j * width + i];
      const c = (pal || palette)[ci];
      const y = (cell + j * (cell));
      const r = ci === 0 ? (cell / 6) : (cell / 2);
      const s = `stroke-width: 0.25px; stroke: #000;`;
      const f = `fill: ${ci === 0 ? "transparent" : "#" + c.toString(16)};`;
      svg += `<circle cx="${x}" cy="${y}" r="${r}" class="cell" style="${s} ${f}" />\n`;
    }
  }

  svg += `</svg>`;
  //console.log(svg)

  return svg;
}


function renderLEGOGroup(img, width, height, groups, groupi) {
  const bb = outerboxLEGO(width, height);
  const side = legoSide - legoGap;
  const model = {
    units: makerjs.unitType.Millimeter,
    paths: {},
    models: {}
  };
  const paths = model.paths;
  const models = model.models;

  for(let gi = 0; gi <= groupi; ++gi) {
      const layer = gi < groupi ? "silver" : "black"
      const group = groups[gi];
      group.points.forEach(point => {
          const { x, y, c } = point;
          const k = `${x},${y}`;
          const r = models[k] = rect(
            x * legoSide,
            (height - y - 1) * legoSide,
            legoSide - legoGap,
            legoSide - legoGap
          )
          r.layer = layer
          const holes = models[k + "b"] = new makerjs.models.BoltRectangle(8, 8, legoHoleRadius)
          holes.origin = [r.origin[0] + 3.9, r.origin[1] + 3.9];
          holes.layer = layer
      })
  }

  models.in = rect(0, 0, bb.w, bb.h);
  const group = groups[groupi];
  models.in.caption = {
      text: `${groupi + 1}: ${paletteNames[group.c]}`,
      anchor: new makerjs.paths.Line([10, bb.h - 10], [50, bb.h - 10])
  };

  // all done
  return model;
}


function renderLayer(img, width, height, color) {
  // check if there is a color to render
  if (!img.some(c => color < 0 || c == color))
    return undefined;

  const bb = outerbox(width, height);
  const model = {
    units: makerjs.unitType.Inch,
    paths: {},
    models: {}
  };
  const paths = model.paths;
  const models = model.models;

  for(let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      const c = img[y * width + x];
      if (color < 0 ? !!c : c == color) {
        const k = `${x},${y}`;
        models[k] = rrect(
          cell + x * (cell + margin),
          cell + (height - y - 1) * (cell + margin),
          cell,
          cell
        );
      }
    }
  }

  // remix models to avoid too much heat when cutting boxes
  for(let i = 0; i < models.length / 2; i+=2) {
    const temp = models[i * 2];
    models[i * 2] = models[models.length - 1 - i * 2];
    models[models.length - 1 - i * 2] = temp;
  }

  models.in = new makerjs.models.RoundRectangle(bb.w, bb.h, cell);
  models.in.origin = [0,0];
  models.corners = rect(0, 0, bb.w, bb.h, cell);
  makerjs.model.combine(models.corners, models.in, false, true, true, false);

  // all done
  return model;
}

function renderImage(img, width, height, prefix) {
  const bb = outerbox(width, height);
  let m = {
    type: "render",
    image: img,
    width: width,
    height: height,
    palette: palette,
    cards: [],
    legocards: []
  };

  let layers = 0;
  let h = '';
  let start = -1
  for(let c = start; c < 16; ++c) {
    if (c == 0) continue; // skip transparent
    const name = c < 0 ? "grid" : c.toString(16);
    const model = renderLayer(img, width, height, c, `${name} ${c < 0 ? "" : palette[c]}`);
    if (model) {
      layers++;
      {
        const fname = `${prefix || "model"}-${name}.dxf`;
        const svg = makerjs.exporter.toSVG(model);
        const dxf = makerjs.exporter.toDXF(model);
        const card = `<a download="${fname}" title="click to download" class="ui card">
  <div class="image">${svg}</div>
  <div class="content">
  <div class="header">layer ${name} ${c > 0 ? '(' + paletteNames[c] + ")" : ''} <span style="color:${c < 0 ? "0" : '#' + palette[c].toString(16)}">■</span>
  </div>
  </div>
  </a>`;
        m.cards.push({
          card: card,
          href: dxf
        })
      }
    }
  }

  m.output = `${width}x${height} / ${bb.w.toFixed(2)}' x ${bb.h.toFixed(2)}' / ${layers} layers`;

  m.svg = renderSvg(img, width, height);
  m.legoSvg = renderSvg(img, width, height, legoPalette)
  m.beadsSvg = renderBeads(img, width, height);

  try {
    const groups = floodFill(img, width, height)
    let legoModel;
    groups.forEach((group, i) => {
        const { c } = group;
        legoModel = renderLEGOGroup(img, width, height, groups, i, `${name} ${legoPalette[group.c]}`);
        const fname = `${prefix || "lego"}-${name}.svg`;
        const svg = makerjs.exporter.toSVG(legoModel);
        const card = `<a download="${fname}" title="click to download" class="ui card">
    <div class="image">${svg}</div>
    <div class="content">
    <div class="header">${i+1}: ${name} ${paletteNames[c]} <span style="color:${'#' + legoPalette[c].toString(16)}">■</span>
    </div>
    </div>
    </a>`;
          m.legocards.push({
            card: card,
            href: svg
          })
    })
  } catch(e) {
    console.error(e)
  }

  self.postMessage(m)
}

function render(src, cellDim, prefix) {
  cell = cellDim;
  updateDims();
  console.log(`rendering image...`)
  let lines = src.trim().split('\n')
    .map(line => line.trim())
    .filter(line => !/^\s*(const|`|let|img`)/.test(line));
  let height = 0;
  let width = 0;
  const img = [];
  for(let y = 0; y < lines.length; ++y) {
    height++;
    const cs = lines[y].replace(/\s*/g, '');
    width = cs.length;
    for(let x = 0; x < width; ++x) {
      let c = cs[x];
      if (!/^[a-z0-9]$/i.test(c))
          c = 0;
      img.push(parseInt("0x" + c))
    }
  }
  console.log(`image ${width} x ${height}`)
  renderImage(img, width, height, prefix);
}

function updateDims() {
  margin = cell / 8; // inch
  corner = cell / 8;
}

self.addEventListener('message', function(e) {
  const d = e.data;
  //console.log(`worker message ${d.type}`);
  switch(d.type) {
    case 'render':
        render(d.img, d.cell, d.prefix);
  }
}, false);