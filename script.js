let field = [];
let points = [];
let iter = 0;
let dtheta = 0.01;
let theta = 0;

let width = window.innerWidth,
  height = window.innerHeight;

let scl = Math.min(width, height) / 1.5;

let stage,
  renderer,
  frameCount = 0;

let hue_seed = 0.4; // Math.random();

let computed_points = 0;

function setup() {
  // Create a Pixi Application
  stage = new PIXI.Container();
  renderer = new PIXI.WebGLRenderer({
    width: width,
    height: height,
    clearBeforeRender: false,
    preserveDrawingBuffer: true,
    transparent: false
  });

  document.body.appendChild(renderer.view);

  for (let i = 0; i < 20; i++) {
    const theta = 2 * Math.random() * Math.PI;
    const r = Math.random() * 0.5 + 0.1;

    const location = [r * Math.cos(theta), r * Math.sin(theta)];
    const direction = [Math.random() - 0.5, Math.random() - 0.5];

    const alttheta = 2 * Math.random() * Math.PI;
    const altr = Math.random() * 0.5 + 0.1;
    const altlocation = [altr * Math.cos(alttheta), altr * Math.sin(alttheta)];

    field.push(
      new PointVector(
        ...location.map((x) => scl * x),
        ...altlocation.map((x) => scl * x),
        ...direction
      )
    );
  }

  for (let _ = 0; _ < 250; _++) {
    const location = [Math.random() - 0.5, Math.random() - 0.5];

    const pt = new Point(...location.map((x) => 1 * scl * x));

    let graphic = new PIXI.Graphics();

    graphic.x = location[0] + width / 2;
    graphic.y = location[1] + height / 2;

    graphic.beginFill(0xffffff, 0.01);
    graphic.drawRect(0, 0, 1, 1);
    graphic.endFill();

    stage.addChild(graphic);
    points.push(pt);
  }
}

function draw() {
  if (theta > 2 * Math.PI) return;

  for (iter = 0; iter < 150; iter++) {
    for (let i = 0; i < points.length; i++) {
      points[i].update();

      if (
        Math.abs(points[i].px - points[i].ipx) < 0.1 &&
        Math.abs(points[i].py - points[i].ipy) < 0.1
      ) {
        stage.children[i].x = width * 2;
        stage.children[i].y = height * 2;
      } else {
        stage.children[i].x = points[i].px + width / 2;
        stage.children[i].y = points[i].py + height / 2;
      }

      let d =
        ((points[i].px - points[i].ipx) ** 2 +
          (points[i].py - points[i].ipy) ** 2) **
        0.5;

      d = Math.min(Math.max(d * 100, 0), 1);

      let h = ((hue_seed + 0.2 * (i / points.length)) % 1) * 360;
      let b = 0.4 * (1 - iter / 150) + 0.4;

      stage.children[i].tint = hslToHex(h, d, b);

      computed_points++;
    }

    renderer.render(stage);
  }

  let cdtheta = Math.cos(dtheta);
  let sdtheta = Math.sin(dtheta);

  for (const pv of field) {
    const dx = pv.dx * cdtheta - pv.dy * sdtheta;
    const dy = pv.dx * sdtheta + pv.dy * cdtheta;

    pv.dx = dx;
    pv.dy = dy;
  }

  theta += dtheta;

  // Reset points
  for (let i = 0; i < points.length; i++) {
    points[i].px = points[i].ipx;
    points[i].py = points[i].ipy;

    points[i].vx = 0;
    points[i].vy = 0;
  }

  requestAnimationFrame(draw);
}

class PointVector {
  constructor(px, py, altx, alty, dx, dy) {
    this.px = px;
    this.py = py;

    this.altx = altx;
    this.alty = alty;

    this.dx = dx;
    this.dy = dy;
  }
}

class Point {
  constructor(px, py) {
    this.ipx = px;
    this.ipy = py;

    this.px = px;
    this.py = py;
    this.vx = 0;
    this.vy = 0;
  }

  update() {
    this.px += this.vx;
    this.py += this.vy;

    this.vx *= 0.97;
    this.vy *= 0.97;

    for (const pv of field) {
      const dist = (pv.px - this.px) ** 2 + (pv.py - this.py) ** 2;
      const mult = Math.exp(-0.0015 * dist);

      this.vx += mult * pv.dx;
      this.vy += mult * pv.dy;
    }
  }
}

function hslToHex(h, s, l) {
  let a = s * Math.min(l, 1 - l);
  let f = (n, k = (n + h / 30) % 12) =>
    l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return PIXI.utils.rgb2hex([f(0), f(8), f(4)]);
}

setup();
draw();