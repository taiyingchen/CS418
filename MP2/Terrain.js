/**
 * @fileoverview Terrain - A simple 3D terrain using WebGL
 * @author Eric Shaffer
 */

/** Class implementing 3D terrain. */
class Terrain{   
/**
 * Initialize members of a Terrain object
 * @param {number} div Number of triangles along x axis and y axis
 * @param {number} minX Minimum X coordinate value
 * @param {number} maxX Maximum X coordinate value
 * @param {number} minY Minimum Y coordinate value
 * @param {number} maxY Maximum Y coordinate value
 */
    constructor(div,minX,maxX,minY,maxY){
        this.div = div;
        this.minX=minX;
        this.minY=minY;
        this.maxX=maxX;
        this.maxY=maxY;
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        console.log("Terrain: Allocated buffers");
        
        this.generateTriangles();
        console.log("Terrain: Generated triangles");
        
        this.generateLines();
        console.log("Terrain: Generated lines");

        this.setHeightsByPartition(100, 0.005);
        console.log("Terrain: Randomized height");

        this.generateNormals();
        console.log("Terrain: Generated Normal vectors");
        
        // Get extension for 4 byte integer indices for drwElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
    }
    
    /**
    * Set the x,y,z coords of a vertex at location(i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    setVertex(v,i,j)
    {
        //Your code here
        var vIndex = 3 * (i * (this.div + 1) + j);
        this.vBuffer[vIndex] = v[0];
        this.vBuffer[vIndex+1] = v[1];
        this.vBuffer[vIndex+2] = v[2];
    }
    
    /**
    * Return the x,y,z coordinates of a vertex at location (i,j)
    * @param {Object} v an an array of length 3 holding x,y,z coordinates
    * @param {number} i the ith row of vertices
    * @param {number} j the jth column of vertices
    */
    getVertex(v,i,j)
    {
        //Your code here
        var vIndex = 3 * (i * (this.div + 1) + j);
        v[0] = this.vBuffer[vIndex];
        v[1] = this.vBuffer[vIndex+1];
        v[2] = this.vBuffer[vIndex+2];
    }
    
    /**
    * Send the buffer objects to WebGL for rendering 
    */
    loadBuffers()
    {
        // Specify the vertex coordinates
        this.VertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);      
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vBuffer), gl.STATIC_DRAW);
        this.VertexPositionBuffer.itemSize = 3;
        this.VertexPositionBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexPositionBuffer.numItems, " vertices");
    
        // Specify normals to be able to do lighting calculations
        this.VertexNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.nBuffer),
                  gl.STATIC_DRAW);
        this.VertexNormalBuffer.itemSize = 3;
        this.VertexNormalBuffer.numItems = this.numVertices;
        console.log("Loaded ", this.VertexNormalBuffer.numItems, " normals");
    
        // Specify faces of the terrain 
        this.IndexTriBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.fBuffer),
                  gl.STATIC_DRAW);
        this.IndexTriBuffer.itemSize = 1;
        this.IndexTriBuffer.numItems = this.fBuffer.length;
        console.log("Loaded ", this.IndexTriBuffer.numItems, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
        
        console.log("triangulatedPlane: loadBuffers");
    }
    
    /**
    * Render the triangles 
    */
    drawTriangles(){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexTriBuffer);
        gl.drawElements(gl.TRIANGLES, this.IndexTriBuffer.numItems, gl.UNSIGNED_INT,0);
    }
    
    /**
    * Render the triangle edges wireframe style 
    */
    drawEdges(){
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.VertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           this.VertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    
        //Draw 
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.drawElements(gl.LINES, this.IndexEdgeBuffer.numItems, gl.UNSIGNED_INT,0);   
    }

    /**
     * Fill the vertex and buffer arrays 
     */    
    generateTriangles()
    {
        var deltaX = (this.maxX - this.minX) / this.div;
        var deltaY = (this.maxY - this.minY) / this.div;

        // Your code here
        // Setting up vertex buffer
        for (var i = 0; i <= this.div; i++) {
            for (var j = 0; j <= this.div; j++) {
                this.vBuffer.push(this.minX+deltaX*j);
                this.vBuffer.push(this.minY+deltaY*i);
                this.vBuffer.push(0); // z = 0

                // Setting up normal vector
                this.nBuffer.push(0);
                this.nBuffer.push(0);
                this.nBuffer.push(0);
            }
        }
        
        // Setting up face buffer
        for (var i = 0; i < this.div; i++) {
            for (var j = 0; j < this.div; j++) {
                var vIndex = i * (this.div + 1) + j;
                // First triangle
                this.fBuffer.push(vIndex);
                this.fBuffer.push(vIndex+1);
                this.fBuffer.push(vIndex+this.div+1);

                // Secound triangle
                this.fBuffer.push(vIndex+1);
                this.fBuffer.push(vIndex+1+this.div+1);
                this.fBuffer.push(vIndex+this.div+1);
            }
        }
        
        //
        this.numVertices = this.vBuffer.length/3;
        this.numFaces = this.fBuffer.length/3;
    }

    /**
     * Print vertices and triangles to console for debugging
     */
    printBuffers()
    {
        
    for(var i=0;i<this.numVertices;i++)
          {
           console.log("v ", this.vBuffer[i*3], " ", 
                             this.vBuffer[i*3 + 1], " ",
                             this.vBuffer[i*3 + 2], " ");
                       
          }
    
      for(var i=0;i<this.numFaces;i++)
          {
           console.log("f ", this.fBuffer[i*3], " ", 
                             this.fBuffer[i*3 + 1], " ",
                             this.fBuffer[i*3 + 2], " ");
                       
          }
        
    }

    /**
     * Generates line values from faces in faceArray
     * to enable wireframe rendering
     */
    generateLines()
    {
        var numTris=this.fBuffer.length/3;
        for(var f=0;f<numTris;f++)
        {
            var fid=f*3;
            this.eBuffer.push(this.fBuffer[fid]);
            this.eBuffer.push(this.fBuffer[fid+1]);
            
            this.eBuffer.push(this.fBuffer[fid+1]);
            this.eBuffer.push(this.fBuffer[fid+2]);
            
            this.eBuffer.push(this.fBuffer[fid+2]);
            this.eBuffer.push(this.fBuffer[fid]);
        }
        
    }

    /**
    * Set the vertex according to a slow but simple noise generation algorithm.
    * We repeatedly partition the terrain using random cutting plane. On one side of the plane
    * we raise the terrain, and on the other we lower it.
    * @param {number} N the number of times to partition the terrain grad and adjust the heights on each side
    * @param {number} delta the amount to raise (and lower) the partitioned vertices
    */
    setHeightsByPartition(N, delta)
    {
        for (var iter = 0; iter < N; iter++) {
            var point = vec3.create();
            point[0] = this.minX + Math.random() * (this.maxX - this.minX);
            point[1] = this.minY + Math.random() * (this.maxY - this.minY);
            var normal = this.getRandomNormalVector();

            for (var i = 0; i <= this.div; i++) {
                for (var j = 0; j <= this.div; j++) {
                    var vertex = vec3.create();
                    var tmp = vec3.create();
                    this.getVertex(vertex, i, j); // Get the coordinate of the vertex
                    vec3.sub(tmp, vertex, point); // tmp = vertex - point
                    if (vec3.dot(tmp, normal) >= 0) { // tmp \dot normal
                        vertex[2] += delta;
                    } else {
                        vertex[2] -= delta;
                    }
                    this.setVertex(vertex, i, j);
                }
            }
        }
    }

    /**
    * Return a unit normal vector for the plane
    */
    getRandomNormalVector()
    {
        var normal = vec3.create();
        var rad = 2 * Math.PI * Math.random();
        normal[0] = Math.cos(rad);
        normal[1] = Math.sin(rad);
        return normal;
    }

    /**
     * To compute per-vertex normal on a mesh with vertices
     */
    generateNormals()
    {
        for (var f = 0; f < this.numFaces; f++) {
            var vertexIndices = this.getTriangleVertexIndices(f);
            var vertices = this.getTriangleVertices(vertexIndices);
            var normal = vec3.create();

            vec3.sub(vertices[1], vertices[1], vertices[0]);
            vec3.sub(vertices[2], vertices[2], vertices[0]);
            vec3.cross(normal, vertices[1], vertices[2]);
            
            this.accumNormals(vertexIndices, normal);
        }

        this.normalizeNormals();
    }

    accumNormals(vertexIndices, normal) {
        for (var i = 0; i < vertexIndices.length; i++) {
            this.nBuffer[3*vertexIndices[i]] += normal[0];
            this.nBuffer[3*vertexIndices[i]+1] += normal[1];
            this.nBuffer[3*vertexIndices[i]+2] += normal[2];
        }
    }

    /**
     * Normalize each normal vector to unit length
     */
    normalizeNormals()
    {
        for (var v = 0; v < this.numVertices; v++) {
            var normal = vec3.fromValues(this.nBuffer[3*v], this.nBuffer[3*v+1], this.nBuffer[3*v+2]);
            vec3.normalize(normal, normal);
            this.nBuffer[3*v] = normal[0];
            this.nBuffer[3*v+1] = normal[1];
            this.nBuffer[3*v+2] = normal[2];
        }
    }

    getTriangleVertexIndices(f)
    {
        return [this.fBuffer[3*f], this.fBuffer[3*f+1], this.fBuffer[3*f+2]];
    }

    getTriangleVertices(indices)
    {
        var v1 = this.getVertexByIndex(indices[0]);
        var v2 = this.getVertexByIndex(indices[1]);
        var v3 = this.getVertexByIndex(indices[2]);
        return [v1, v2, v3];
    }

    getVertexByIndex(index)
    {
        var v = vec3.create();
        v[0] = this.vBuffer[3*index]; // x coordinate
        v[1] = this.vBuffer[3*index+1]; // y coordinate
        v[2] = this.vBuffer[3*index+2]; // z coordinate
        return v;
    }

    getMinMaxHeight()
    {
        var min = Infinity;
        var max = -Infinity;
        for (var i = 0; i < this.numVertices; i++) {
            var height = this.vBuffer[3*i+2]; // z coordinate
            if (height < min) {
                min = height;
            }
            if (height > max) {
                max = height;
            }
        }
        return [min, max];
    }
}
