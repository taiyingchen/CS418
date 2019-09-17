
/**
 * @file CS418 Interactive Computer Graphics MP1: Dancing Logo
 * @author Tai-Ying Chen <tychen2@eillinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The angle of rotation */
var theta = 0;

/** @global Last time record for cumputing elapsed time */
var lastTime = 0;

/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {object} WebGL context
 */
function createGLContext(canvas) {
  var context = null;
  context = canvas.getContext("webgl");
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);

  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }

  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

/**
 * Load vertices to buffer
 */
function loadVertices() {
  // Vertices to compose the U of I logo,
  // draw a large blue I, then draw a small orange I,
  // covering the blue I with the small orange I to get the blue border.
  var triangleVertices = [
    // Blue: top
    -0.55, 0.45, 0.0,
    -0.55, 0.85, 0.0,
    -0.35, 0.45, 0.0,
    -0.55, 0.85, 0.0,
    -0.35, 0.45, 0.0,
    0, 0.85, 0.0,
    -0.35, 0.45, 0.0,
    0, 0.85, 0.0,
    0.35, 0.45, 0.0,
    0, 0.85, 0.0,
    0.35, 0.45, 0.0,
    0.55, 0.85, 0.0,
    0.35, 0.45, 0.0,
    0.55, 0.85, 0.0,
    0.55, 0.45, 0.0,
    // Body
    -0.35, 0.45, 0.0,
    0.35, 0.45, 0.0,
    -0.35, 0.0, 0.0,
    0.35, 0.45, 0.0,
    -0.35, 0.0, 0.0,
    0.35, -0.45, 0.0,
    -0.35, 0.0, 0.0,
    0.35, -0.45, 0.0,
    -0.35, -0.45, 0.0,
    // Bottom
    -0.55, -0.45, 0.0,
    -0.55, -0.85, 0.0,
    -0.35, -0.45, 0.0,
    -0.55, -0.85, 0.0,
    -0.35, -0.45, 0.0,
    0, -0.85, 0.0,
    -0.35, -0.45, 0.0,
    0, -0.85, 0.0,
    0.35, -0.45, 0.0,
    0, -0.85, 0.0,
    0.35, -0.45, 0.0,
    0.55, -0.85, 0.0,
    0.35, -0.45, 0.0,
    0.55, -0.85, 0.0,
    0.55, -0.45, 0.0,
    // Orange: top
    -0.5, 0.5, 0.0,
    -0.5, 0.8, 0.0,
    -0.3, 0.5, 0.0,
    -0.5, 0.8, 0.0,
    -0.3, 0.5, 0.0,
    0, 0.8, 0.0,
    -0.3, 0.5, 0.0,
    0, 0.8, 0.0,
    0.3, 0.5, 0.0,
    0, 0.8, 0.0,
    0.3, 0.5, 0.0,
    0.5, 0.8, 0.0,
    0.3, 0.5, 0.0,
    0.5, 0.8, 0.0,
    0.5, 0.5, 0.0,
    // Body
    -0.3, 0.5, 0.0,
    0.3, 0.5, 0.0,
    -0.3, 0.0, 0.0,
    0.3, 0.5, 0.0,
    -0.3, 0.0, 0.0,
    0.3, -0.5, 0.0,
    -0.3, 0.0, 0.0,
    0.3, -0.5, 0.0,
    -0.3, -0.5, 0.0,
    // Bottom
    -0.5, -0.5, 0.0,
    -0.5, -0.8, 0.0,
    -0.3, -0.5, 0.0,
    -0.5, -0.8, 0.0,
    -0.3, -0.5, 0.0,
    0, -0.8, 0.0,
    -0.3, -0.5, 0.0,
    0, -0.8, 0.0,
    0.3, -0.5, 0.0,
    0, -0.8, 0.0,
    0.3, -0.5, 0.0,
    0.5, -0.8, 0.0,
    0.3, -0.5, 0.0,
    0.5, -0.8, 0.0,
    0.5, -0.5, 0.0,
  ];

  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = triangleVertices.length / vertexPositionBuffer.itemSize;
}

/**
 * Load colors to buffer
 */
function loadColors() {
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  var blue = [
    19 / 256, 41 / 256, 74 / 256, 1.0
  ];
  var orange = [
    234 / 256, 76 / 256, 39 / 256, 1.0
  ];
  var colors = [];

  // First half of the buffer filled blue color,
  // the other half filled orange color.
  for (var i = 0; i < vertexPositionBuffer.numberOfItems; i++) {
    if (i < vertexPositionBuffer.numberOfItems / 2) colors.push(...blue);
    else colors.push(...orange);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.DYNAMIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = vertexPositionBuffer.numberOfItems;
}

/**
 * Populate buffers with data
 */
function setupBuffers() {
  //Generate the vertex positions    
  loadVertices();

  //Generate the vertex colors
  loadColors();
}

/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/**
 * Translates degrees to radians
 * @param {number} degrees Degree input to function
 * @return {number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT);

  mat4.identity(mvMatrix);
  mat4.scale(mvMatrix, mvMatrix, vec3.fromValues(Math.cos(degToRad(theta)), Math.cos(degToRad(theta)), 1));
  mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(Math.sin(degToRad(theta)), 0, 0));
  // mat4.rotateZ(mvMatrix, mvMatrix, degToRad(theta));
  mat4.identity(pMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute,
    vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute,
    vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  setMatrixUniforms();

  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Calculate the deformatino for a given vertex on the circle
 * @param {number} x coordinate of circel boundary point
 * @param {number} y coordinate of circel boundary point
 * @param {number} angle around the circle of the boundary point
 * @returns {object} a deformation vector to be applied to the boundary point
 */
function deformSin(x, y, angle) {
  var circPt = vec2.fromValues(x, y);
  var dist = 0.2 * Math.sin((angle)+degToRad(defAngle));
  vec2.normalize(circPt, circPt);
  vec2.scale(circPt, circPt, dist);
  return circPt;
}

/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsedTime = timeNow - lastTime;
    theta = (theta + 1.0) % 360;
  }
  lastTime = timeNow;
  loadVertices();
}

/**
 * Tick called for every animation frame.
 */
function tick() {
  type = document.getElementsByName("type");
  requestAnimFrame(tick);
  if (type[0].checked) draw();
  else if (type[1].checked) ;
  animate();
}

/**
 * Startup function called from html code to start program.
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  // gl.enable(gl.DEPTH_TEST);
  tick();
}
