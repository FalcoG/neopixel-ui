// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const five = require('johnny-five');
const pixel = require('node-pixel');

const options = {
  port: 'COM4',
  pin: 5,
  startPoint: 12,
  quantity: 121,
};

const board = new five.Board({
  port: options.port,
  repl: false,
});

board.on('ready', () => {
  console.log('Board is ready!');

  /**
   * When unsure if the Arduino is connecting
   */
  // const led = new five.Led(13); // The on-board LED
  // led.blink(500);

  const strip = new pixel.Strip({
    board: board,
    controller: 'FIRMATA',
    strips: [{
      pin: options.pin,
      length: options.quantity,
    }],
    gamma: 2.8, // set to a gamma that works nicely for WS2812
  });

  strip.on('ready', () => {
    console.log('Strip is ready to be used');

    // new Effect(options, strip, 'knight-rider');
    // new Effect(options, strip, 'gradient');
    new Effect(options, strip, 'solid');

    document.querySelectorAll('[data-effect]').forEach((item) => {
      item.addEventListener('click', () => {
        new Effect(options, strip, item.getAttribute('data-effect'));
      });
    });

    // new Visualizer(options, strip);
  });
});

class Generate{
  static hex(value){
    value = value.toString(16);
    return (value.length === 1) ? '0' + value : value;
  }

  static gradient(startColor, endColor, ratio){
    const r = Math.floor(parseInt(endColor.substring(0,2), 16) * ratio + parseInt(startColor.substring(0,2), 16) * (1-ratio));
    const g = Math.floor(parseInt(endColor.substring(2,4), 16) * ratio + parseInt(startColor.substring(2,4), 16) * (1-ratio));
    const b = Math.floor(parseInt(endColor.substring(4,6), 16) * ratio + parseInt(startColor.substring(4,6), 16) * (1-ratio));

    return `#${this.hex(r) + this.hex(g) + this.hex(b)}`;
  }

  static ripple(primaryColor, secondaryColor, index){
    return `#${index % 2 === 0 ? primaryColor : secondaryColor}`;
  }

  static randomColor(){
    const chars = '0123456789ABCDEF';

    let length = 6;
    let hex = '';

    while(length--) hex += chars[(Math.random() * 16) | 0];

    return hex;
  }
}

class Effect{
  constructor(options, strip, effect){
    this.options = options;
    this.strip = strip;

    this.start(effect);
  }

  iteratePixels(effect){
    let primary = Generate.randomColor(), secondary = Generate.randomColor();

    switch(effect){
      case 'gradient':
        // primary = '8d44ad';
        primary = '4568DC';
        // secondary = 'c1392b';
        secondary = 'B06AB3';
        break;
      case 'ripple':
        // primary = 'ffffff';
        // secondary = 'ffffff';
        break;
      case 'knight-rider':
        primary = 'ff0000';
        secondary = '000000';
        break;
      case 'solid':
        // primary = '222222'; // dark
        // primary = 'ffffff'; // pure white
        // primary = 'f8c365'; // warm colour
        primary = '00ff00';
        break;
      case 'white':
        primary = 'ffffff';
        break;
      case 'warm':
        primary = 'f8c365';
        break;
      case 'off':
        primary = '000000';
        break;
    }

    for(let i = 0; i < this.options.quantity - this.options.startPoint; i++){
      const pixelNumber = i + this.options.startPoint;
      const currentPixel = this.strip.pixel(pixelNumber);

      switch(effect){
        case 'gradient':
        case 'knight-rider':
          currentPixel.color(Generate.gradient(primary, secondary, i / this.options.quantity));
          break;
        case 'solid':
        case 'white':
        case 'warm':
        case 'off':
          currentPixel.color(`#${primary}`);
          break;
        default:
          currentPixel.color(Generate.ripple(primary, secondary, i));
          break;
      }
    }

    this.strip.show();

    switch(effect){
      case 'knight-rider':
        let limit = this.options.quantity;
        let current = 0;

        // this.strip.shift(this.options.quantity, pixel.FORWARD, true);
        // this.strip.show();

        this.loop = setInterval(() => {
          if(current <= limit){
            this.strip.shift(1, pixel.FORWARD, true);
            this.strip.show();

            current++;
          }else if(current <= limit*2){
            this.strip.shift(1, pixel.BACKWARD, true);
            this.strip.show();

            current++;
          }else{
            current = 0;
          }
        }, 60);
        break;
    }
  }

  start(effect){
    // this.loop = setInterval(() => {
    this.iteratePixels(effect);
    // }, 1000);
  }

  stop(){
    if(this.loop){
      clearInterval(this.loop);
    }
  }
}

class Visualizer{
  constructor(options, strip){
    this.options = options;
    this.strip = strip;

    console.log('Attempting to visualize audio data.');

    this.initiate();
  }

  initiate(){
    const that = this;

    const canvas = document.querySelector('.visualizer');
    const canvasCtx = canvas.getContext("2d");

    canvas.setAttribute('width', `${window.innerWidth}px`);

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const analyser = audioCtx.createAnalyser();
    analyser.minDecibels = -100;
    analyser.maxDecibels = -20;
    // analyser.smoothingTimeConstant = 0.85;
    analyser.smoothingTimeConstant = 0.25;

    let source, drawVisual;

    if (navigator.getUserMedia) {
      console.log('getUserMedia supported.');
      navigator.getUserMedia ({
          audio: true
      }, (stream) => {
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        visualize();
      }, (err) => {
        console.log('The following gUM error occured: ' + err);
      });
    } else {
      console.log('getUserMedia not supported on your browser!');
    }

    function visualize() {
      let WIDTH = canvas.width;
      let HEIGHT = canvas.height;

      analyser.fftSize = 256;
      let bufferLengthAlt = analyser.frequencyBinCount;
      let dataArrayAlt = new Uint8Array(bufferLengthAlt);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      const drawAlt = () => {
        analyser.getByteFrequencyData(dataArrayAlt);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        const barWidth = (WIDTH / bufferLengthAlt) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLengthAlt; i++) {
          barHeight = dataArrayAlt[i];

          canvasCtx.fillStyle = 'rgb(' + (barHeight) + ',50,50)';
          canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

          x += barWidth + 1;
        }

        for (let i = 0; i < that.options.quantity - that.options.startPoint; i++) {
          const pixelNumber = i + that.options.startPoint;
          const currentPixel = that.strip.pixel(pixelNumber);

          barHeight = dataArrayAlt[i];

          if(barHeight > 50){
            currentPixel.color(Generate.gradient('FFA200', 'FF0000', barHeight / 255));
          }else{
            // low levels
            currentPixel.color(Generate.gradient('EAFF00', 'FFA200', barHeight / 255));
          }

          // currentPixel.color(Generate.gradient('000000', 'FFFFFF', barHeight / 255))
        }

        that.strip.show();
      };

      setInterval(drawAlt, 250);
      // drawAlt();
    }
  }
}