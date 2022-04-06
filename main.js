import "./style.css";
import q5 from "q5xjs";
import { hexToRGB } from "./utils";

new q5("global");

let audioCtx;
let analyser;
let width = window.innerWidth;
let height = window.innerHeight;

// hex format for better IDE visual &
// convience for cv from design tools
const COLOR_HEX = {
  blue: "#120EED",
  green: "#17EB96",
  pink: "#F310CF",
  yellow: "#EEF20B",
  white: "#ffffff",
};

const COLOR = Object.keys(COLOR_HEX).reduce((acc, key) => {
  const rbg = hexToRGB(COLOR_HEX[key]);
  acc[key] = color(rbg.r, rbg.g, rbg.b);
  return acc;
}, {});

// connect mic stream to analyser
navigator.mediaDevices
  .getUserMedia({
    audio: true,
  })
  .then((stream) => {
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.9;

    const streamNode = audioCtx.createMediaStreamSource(stream);
    streamNode.connect(analyser);
  });

setup = () => {
  createCanvas(width, height);
  pixelDensity(2);
};

const drawCircles = (R, x, y) => {
  push();
  noFill();
  strokeWeight(2);
  stroke(COLOR.pink);
  circle(x, y, R);
  pop();
};
const drawGreenCircles = (R, x, y) => {
  push();
  strokeWeight(4);
  stroke(COLOR.green);
  noFill();
  circle(x, y, R);
  pop();
};
const drawRedCircle = (R, x, y) => {
  push();
  noStroke();
  fill(COLOR.blue);
  circle(x, y, R);
  pop();
};

const drawTopBar = (dataArray) => {
  push();
  const dx = width / dataArray.length;
  for (let i = 0; i < dataArray.length; i++) {
    const mixedColor = lerpColor(
      COLOR.green,
      COLOR.white,
      i / dataArray.length
    );
    fill(mixedColor);
    rect(i * dx, 0, dx - 1, 1 + dataArray[i]);
  }
  pop();
};

const drawBottomBar = (dataArray) => {
  push();
  const dx = width / dataArray.length;
  for (let i = 0; i < dataArray.length; i++) {
    const mixedColor = lerpColor(COLOR.blue, COLOR.white, i / dataArray.length);
    fill(mixedColor);
    rect(width - i * dx, height - dataArray[i] - 1, dx - 1, 1 + dataArray[i]);
  }
  pop();
};

const drawParticles = (dataArray) => {
  push();
  noStroke();
  const n = dataArray.length;
  const x = width / 2;
  const y = height / 2;
  const R = 200;
  const D_ANGLE = 360 / n;
  let angle = 0;
  const { sin, cos, PI } = Math;
  for (let i = 0; i < n; i++) {
    push();
    translate(x + cos((angle / 180) * PI) * R, y + sin((angle / 180) * PI) * R);
    rotate(((angle - 90) / 180) * PI);
    rect(0, 0, 2, dataArray[i]);
    pop();
    angle += D_ANGLE;
  }
  pop();
};

draw = () => {
  background(0);
  noStroke();
  if (!analyser) return;
  const frequencyArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(frequencyArray);
  // const timeArray = new Uint8Array(analyser.fftSize);
  // analyser.getByteTimeDomainData(timeArray);

  drawTopBar(frequencyArray);
  drawBottomBar(frequencyArray);
  drawCircles(200 + frequencyArray[20], width / 2, height / 2);
  drawCircles(100 + frequencyArray[30], width / 2, height / 2);
  drawGreenCircles(30 + frequencyArray[60], width / 2, height / 2);
  drawRedCircle(10 + frequencyArray[100], width / 2, height / 2);
  drawParticles(frequencyArray);
};

window.onresize = () => {
  width = window.innerWidth;
  height = window.innerHeight;
  resizeCanvas(width, height);
  pixelDensity(2);
};
