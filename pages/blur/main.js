import "../style.css"

(() => {
  // Connect audio source (replace this with your actual audio source)
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      // Set up audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      return analyser;
    })
    .then(analyser => {
      // Create canvas element
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Get WebGL context
      const gl = canvas.getContext('webgl');

      // Vertex shader source
      const vertexShaderSource = `
        attribute vec2 a_position;
        void main() {
          gl_Position = vec4(a_position, 0, 1);
        }

        
      `;
      const color1 = '102, 103, 134';
      const color2 = '158, 116, 155';
      const blue = '127, 184, 214';
      const green = '115, 200, 156';
      // Fragment shader source
      const fragmentShaderSource = 
        `precision mediump float;
        
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_audioLow;
        uniform float u_audioMid;
        uniform float u_audioHigh;
        uniform vec2 u_blurCenter;
        uniform vec2 u_randomOffset;

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution;
          
          // Chill R&B style colors
          vec3 color1 = vec3(${blue}) / vec3(255);
          vec3 color2 = vec3(${green}) / vec3(255);
          vec3 gradientColor = mix(color1, color2, uv.x + sin(u_time * 0.001) * 0.1);
          
          // Audio-reactive effects
          float lowFreq = u_audioLow * 2.0;
          float midFreq = u_audioMid * 2.0;
          float highFreq = u_audioHigh * 2.0;

          // Dynamic effect based on audio
          vec2 distortedUV = uv + vec2(
            sin(uv.y * 10.0 + u_time * 0.01) * midFreq * 0.02,
            cos(uv.x * 10.0 - u_time * 0.01) * highFreq * 0.02
          );

          // Create a flowing "glow" effect
          float glow = sin(distortedUV.x * 10.0 + u_randomOffset.x) * sin(distortedUV.y * 10.0 + u_randomOffset.y) * lowFreq;
          
          vec3 finalColor = gradientColor + vec3(glow * 0.1);
          
          // Flowing blur effect
          float blurAmount = 0.01 + 0.02 * lowFreq; // Adjust blur based on low frequency
          vec2 blurOffset = (uv - u_blurCenter) * blurAmount;
          finalColor = mix(finalColor, 
                           finalColor * (1.0 - length(blurOffset) * 2.0), 
                           0.5);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }`
      ;


      // Compile shader function
      function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }

        return shader;
      }

      const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
      const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

      // Create shader program
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return;
      }

      gl.useProgram(program);

      // Set up vertex buffer
      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      // Get uniform locations
      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
      const timeLocation = gl.getUniformLocation(program, 'u_time');
      const audioLowLocation = gl.getUniformLocation(program, 'u_audioLow');
      const audioMidLocation = gl.getUniformLocation(program, 'u_audioMid');
      const audioHighLocation = gl.getUniformLocation(program, 'u_audioHigh');
      const blurCenterLocation = gl.getUniformLocation(program, 'u_blurCenter');
      const randomOffsetLocation = gl.getUniformLocation(program, 'u_randomOffset');

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Function to get audio data
      function getAudioData() {
        analyser.getByteFrequencyData(dataArray);
        const bass = dataArray.slice(0, 10).reduce((a, b) => a + b) / 2550;
        const mid = dataArray.slice(10, 100).reduce((a, b) => a + b) / 22950;
        const treble = dataArray.slice(100, 256).reduce((a, b) => a + b) / 39900;
        return { bass, mid, treble };
      }

      // Function to generate random blur center
      function getRandomBlurCenter(time) {
        const speed = 0.0001; // Adjust this value to change the speed of movement
        return [
          0.5 + 0.3 * Math.sin(time * speed),
          0.5 + 0.3 * Math.cos(time * speed * 1.3)
        ];
      }

      // Function to generate random offset
      function getRandomOffset(time) {
        return [
          Math.sin(time * 0.0003) * 2.0,
          Math.cos(time * 0.0002) * 2.0
        ];
      }

      // Render loop
      function render(time) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform1f(timeLocation, time);

        const { bass, mid, treble } = getAudioData();
        gl.uniform1f(audioLowLocation, bass);
        gl.uniform1f(audioMidLocation, mid);
        gl.uniform1f(audioHighLocation, treble);

        const blurCenter = getRandomBlurCenter(time);
        gl.uniform2f(blurCenterLocation, blurCenter[0], blurCenter[1]);

        const randomOffset = getRandomOffset(time);
        gl.uniform2f(randomOffsetLocation, randomOffset[0], randomOffset[1]);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
      }

      requestAnimationFrame(render);

      // Adjust canvas size on window resize
      window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      });
    })
    .catch(err => console.error('Error accessing audio:', err));
})();
