/**
 * @fileoverview TriMesh - A simple 3D surface mesh for use with WebGL
 * @author Eric Shaffer
 */

/** Class implementing triangle surface mesh. */
class TriMesh{   
/**
 * Initialize members of a TriMesh object
 */
    constructor(){
        this.isLoaded = false;
        this.minXYZ=[0,0,0];
        this.maxXYZ=[0,0,0];
        
        this.numFaces=0;
        this.numVertices=0;
        
        // Allocate vertex array
        this.vBuffer = [];
        // Allocate triangle array
        this.fBuffer = [];
        // Allocate normal array
        this.nBuffer = [];
        // Allocate array for edges so we can draw wireframe
        this.eBuffer = [];
        // Allocate  array for texture coordinates
        this.texcoordBuffer = [];
        
        console.log("TriMesh: Allocated buffers");
        
        // Get extension for 4 byte integer indices for drawElements
        var ext = gl.getExtension('OES_element_index_uint');
        if (ext ==null){
            alert("OES_element_index_uint is unsupported by your browser and terrain generation cannot proceed.");
        }
        else{
            console.log("OES_element_index_uint is supported!");
        }
    }
    
    /**
    * Return if the JS arrays have been populated with mesh data
    */
    loaded(){
        return this.isLoaded;
    }
    
    
   
    /**
    * Find a box defined by min and max XYZ coordinates
    */
    computeAABB(){
        var v = vec3.create();

        for (var i = 0; i < this.fBuffer.length; i++) {
            // v stores the xyz coordinates
            this.getVertex(this.fBuffer[i], v);

            for (var j = 0; j < v.length; j++) {
                if (v[j] < this.minXYZ[j]) {
                    this.minXYZ[j] = v[j];
                }
                if (v[j] > this.maxXYZ[j]) {
                    this.maxXYZ[j] = v[j];
                }
            }
        }
    }
    
    /**
    * Return an axis-aligned bounding box
    * @param {Object} an array object of length 3 to fill win min XYZ coords
    * @param {Object} an array object of length 3 to fill win max XYZ coords
    */
    getAABB(minXYZ,maxXYZ){
        for (var i = 0; i < this.minXYZ.length; i++) {
            minXYZ[i] = this.minXYZ[i];
            maxXYZ[i] = this.maxXYZ[i];
        }
    }
    
    /**
    * Populate the JS arrays by parsing a string containing an OBJ file
    * @param {string} text of an OBJ file
    */
    loadFromOBJ(fileText)
    {
    
        //Your code here
        var lines = fileText.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line[0] == "#") {
                // If line start with #, it's comment so ignore it
                continue;
            } else {
                var tokens = line.split(/\b\s+(?!$)/);
                if (tokens[0] == "v") {
                    for (var j = 1; j < tokens.length; j++) {
                        this.vBuffer.push(parseFloat(tokens[j]));
                    }
                } else if (tokens[0] == "f") {
                    for (var j = 1; j < tokens.length; j++) {
                        this.fBuffer.push(parseInt(tokens[j]-1)); // vertex index in object file start at 1
                    }
                }
            }
        }
        
        this.numFaces = this.fBuffer.length / 3;
        this.numVertices = this.vBuffer.length / 3;
        
        
        
        
        
        //----------------
        console.log("TriMesh: Loaded ", this.numFaces, " triangles.");
        console.log("TriMesh: Loaded ", this.numVertices, " vertices.");
        
        this.generateNormals();
        console.log("TriMesh: Generated normals");
        
        this.generateLines();
        console.log("TriMesh: Generated lines");
        
        myMesh.loadBuffers();
        this.isLoaded = true;
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
        console.log("Loaded ", this.IndexTriBuffer.numItems/3, " triangles");
    
        //Setup Edges  
        this.IndexEdgeBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.IndexEdgeBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.eBuffer),
                  gl.STATIC_DRAW);
        this.IndexEdgeBuffer.itemSize = 1;
        this.IndexEdgeBuffer.numItems = this.eBuffer.length;
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
* Set the x,y,z coords of a vertex at location id
* @param {number} the index of the vertex to set 
* @param {number} x coordinate
* @param {number} y coordinate
* @param {number} z coordinate
*/
setVertex(id,x,y,z){
    var vid = 3*id;
    this.vBuffer[vid]=x;
    this.vBuffer[vid+1]=y;
    this.vBuffer[vid+2]=z;
}

/**
* Return the x,y,z coords of a vertex at location id
* @param {number} the index of the vertex to return
* @param {Object} a length 3 array to populate withx,y,z coords
*/    
getVertex(id, v){
    var vid = 3*id;
    v[0] = this.vBuffer[vid];
    v[1] = this.vBuffer[vid+1];
    v[2] = this.vBuffer[vid+2];
}

/**
* Compute per-vertex normals for a mesh
*/   
generateNormals(){
    //per vertex normals
    this.numNormals = this.numVertices;
    this.nBuffer = new Array(this.numNormals*3);
    
    for(var i=0;i<this.nBuffer.length;i++)
        {
            this.nBuffer[i]=0;
        }
    
    for(var i=0;i<this.numFaces;i++)
        {
            // Get vertex coodinates
            var v1 = this.fBuffer[3*i]; 
            var v1Vec = vec3.fromValues(this.vBuffer[3*v1], this.vBuffer[3*v1+1],                                           this.vBuffer[3*v1+2]);
            var v2 = this.fBuffer[3*i+1]; 
            var v2Vec = vec3.fromValues(this.vBuffer[3*v2], this.vBuffer[3*v2+1],                                           this.vBuffer[3*v2+2]);
            var v3 = this.fBuffer[3*i+2]; 
            var v3Vec = vec3.fromValues(this.vBuffer[3*v3], this.vBuffer[3*v3+1],                                           this.vBuffer[3*v3+2]);
            
           // Create edge vectors
            var e1=vec3.create();
            vec3.subtract(e1,v2Vec,v1Vec);
            var e2=vec3.create();
            vec3.subtract(e2,v3Vec,v1Vec);
            
            // Compute  normal
            var n = vec3.fromValues(0,0,0);
            vec3.cross(n,e1,e2);
            
            // Accumulate
            for(var j=0;j<3;j++){
                this.nBuffer[3*v1+j]+=n[j];
                this.nBuffer[3*v2+j]+=n[j];
                this.nBuffer[3*v3+j]+=n[j];
            }         
             
        }
    for(var i=0;i<this.numNormals;i++)
        {
            var n = vec3.fromValues(this.nBuffer[3*i],
                                    this.nBuffer[3*i+1],
                                    this.nBuffer[3*i+2]);
            vec3.normalize(n,n);
            this.nBuffer[3*i] = n[0];
            this.nBuffer[3*i+1]=n[1];
            this.nBuffer[3*i+2]=n[2];  
        }
}    

    
}
