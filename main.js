import "./style.css";
import p5 from "p5";

let audioCtx;
let analyser;
const width = window.innerWidth;
const height = window.innerHeight;
const COLOR = {
  blue: "#120EED",
  green: "#17EB96",
  pink: "#F310CF",
  yellow: "#EEF20B",
};

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

const sketch = (s) => {
  s.setup = () => {
    s.createCanvas(width, height);
  };

  const drawCircles = (R, x, y) => {
    s.push();
    s.noFill();
    s.strokeWeight(2);
    s.stroke(COLOR.pink);
    s.circle(x, y, R);
    s.pop();
  };
  const drawGreenCircles = (R, x, y) => {
    s.push();
    s.strokeWeight(4);
    s.stroke(COLOR.green);
    s.noFill();
    s.circle(x, y, R);
    s.pop();
  };
  const drawRedCircle = (R, x, y) => {
    s.push();
    s.noStroke();
    s.fill(COLOR.blue);
    s.circle(x, y, R);
    s.pop();
  };

  const drawTopBar = (dataArray) => {
    s.push();
    s.fill(COLOR.green);
    const dx = width / dataArray.length;
    for (let i = 0; i < dataArray.length; i++) {
      s.rect(i * dx, 0, dx - 1, dataArray[i]);
    }
    s.pop();
  };

  const drawBottomBar = (dataArray) => {
    s.push();
    s.fill(COLOR.yellow);
    const dx = width / dataArray.length;
    for (let i = 0; i < dataArray.length; i++) {
      s.rect(width - i * dx, height - dataArray[i], dx - 1, dataArray[i]);
    }
    s.pop();
  };

  const drawParticles = (dataArray) => {
    s.push();
    s.noStroke();
    const n = dataArray.length;
    const x = width / 2;
    const y = height / 2;
    const R = 200;
    const D_ANGLE = 360 / n;
    let angle = 0;
    const { sin, cos, PI } = Math;
    for (let i = 0; i < n; i++) {
      s.push();
      s.translate(
        x + cos((angle / 180) * PI) * R,
        y + sin((angle / 180) * PI) * R
      );
      s.rotate(((angle - 90) / 180) * PI);
      s.rect(0, 0, 2, dataArray[i]);
      s.pop();
      angle += D_ANGLE;
    }
    s.pop();
  };

  s.draw = () => {
    s.background(0);
    s.noStroke();
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
};

const sketchInstance = new p5(sketch);
