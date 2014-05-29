function drawClouds( context ) {
    context.save();

    context.beginPath();
    context.fillStyle = "rgba(255, 255, 255, 0.8)";
    context.strokeStyle = "rgba(255, 255, 255, 0.8)";
    context.arc( 100, 100, 60, 0, Math.PI * 2, false );
    context.scale( 2, 1 );
    context.arc( 110, 100, 30, 0, Math.PI * 2, false );

    context.fill();
    //context.closePath();  
    context.restore();
 
}

function Boid( properties ) {
   
    // basic properties for boid (can be passed in constructor object)
    this._mass = properties.mass || 20;
    this._maxSpeed = properties.maxSpeed || 4;
    this._maxAcceleration = properties.maxAcceleration || 3;
    this.behaviors = properties.behaviors || undefined;	// behavior data
    //this.pathIndex = properties.pathIndex;

    // other vector properties
    this._position = new Vector2D( properties.x, properties.y );
    this._velocity = new Vector2D( properties.vx, properties.vy );
    this.rotation = 0;
    this.gravity = properties.gravity || 0;
    this.spring = properties.spring || 0;
    this.friction = properties.friction || 0;

    this.bounce = properties.bounce || 0;
    this.xScale = properties.xScale || 1;
    this.yScale = properties.yScale || 1;
    this.radius = properties.radius || 20;
    this.numStringPoints = properties.numStringPoints || 5;
    
    // behavior specifics
    this.seekObject = undefined;
    this.followObject = undefined;
    this.evadeObject = undefined;

    this.gunWidth = properties.gunWidth || 14;
    this.gunHeight = properties.gunHeight || 27;

    // drawing graphics
    this.graphicsForDrawing = ( properties.graphicsForDrawing == undefined ) ? null : new Graphics( properties.graphicsForDrawing );
    

}
Boid.prototype = {
    // get boid bounds
    getBounds: function () {
      return {
        x: this.x - this.radius * this.xScale - 10,
        y: this.y - this.radius * this.yScale - 10,
        width: this.radius * 2 * this.xScale + 20,
        height: this.radius * 2 * this.yScale + 20
      };
    },   
    // string points
    getStringPoints: function( numStringPts, context ){
        var strPts = [];
        var x = this.x;
        var y = this.y + this.radius;
    
        while ( numStringPts-- ){            
            y += 20;
            
            var pt = new Boid ({
              x: x,
              y: y,
              vx: 0,
              vy: 0,
              radius: 4,
              spring: 0.03,
              friction: 0.9,
              gravity: 1,            
              graphicsForDrawing: {
                context: context,            
                lineWidth: 1,
                fillStyle: this.graphicsForDrawing.fillStyle
                }
            })
            strPts.push( pt );
        }
        return strPts;                            
    },
    toString: function() {
        return Math.random() * 12345678;
    },

    /**
    * Updates the boid based on velocity
    */
    update: function() {
        this._velocity.truncate( this._maxSpeed );    // keep it witin its max speed
        this.rotation = this._velocity.angle() * 180 / Math.PI; // rotation = the velocity's angle converted to degrees
        this._position = this._position.add( this._velocity );    // move it

        this._velocity.add( this.behaviors.force( this._velocity, this._position, this._maxSpeed, this._maxAcceleration, this._mass ) );  // execute behavior 
        
        // apply gravity
        if ( this.gravity ){
            this._velocity.vy += this.gravity;           
        }
        
        // Bounce off walls
        if ( this.bounce ) {
            if ( this.x + this.radius > canvas.width ) {
              this.x = canvas.width - this.radius;
              this._velocity.x *= this.bounce;
            } else if ( this.x - this.radius < 0 ) {
              this.x = this.radius;
              this._velocity.x *= this.bounce;
            }
            if ( this.y + this.radius > canvas.height ) {
              this.y = canvas.height - this.radius;
              this._velocity.y *= this.bounce;
            } else if ( this.y - this.radius < 0) {
              this.y = this.radius;
              this._velocity.y *= this.bounce;
            }             
        }
            
        //clamp boid to screen
        /*
        if ( this.x < -this.radius ) {
            this.x = canvas.width + this.radius;
        } else if ( this.x > canvas.width + this.radius ) {
            this.x = -this.radius;
        }
        
        if ( this.y < -this.radius ) {
            this.y = canvas.height + this.radius;
        } else if (this.y > canvas.height + this.radius) {
            this.y = 0;
        }
        */
    },
    draw: function() {  

        this.graphicsForDrawing.save();
 
        //draw balloon string
        var that = this;
        
        function updateStrPt ( pt, target ) {      
            var toTarget = target.position().cloneVector().subtract( pt.position() );
            
            pt.velocity().add( toTarget.multiply( pt.spring ) );
            pt.vy += pt.gravity;
            pt.velocity().multiply( pt.friction );
            pt.position().add( pt.velocity() );
        }
               
        if ( this.stringPoints ){
            for ( var i = 0; i < this.stringPoints.length; i++ ){
                //if first point, move to balloon            
                var thisPt = this.stringPoints[ i ];
                if ( i === 0 ) {
                  updateStrPt( thisPt, this );
                  this.graphicsForDrawing.moveTo( this.x, this.y );
                } else {
                  var prevPt = this.stringPoints[ i - 1 ];
        
                  updateStrPt( thisPt, prevPt );
                  this.graphicsForDrawing.moveTo( prevPt.x, prevPt.y );
                }
                this.graphicsForDrawing.lineTo( thisPt.x, thisPt.y );
                this.graphicsForDrawing.stroke();
                thisPt.draw();
                this.graphicsForDrawing.closePath();
            }        
        }     


       //draw balloon
             
        this.graphicsForDrawing.beginPath();
        this.graphicsForDrawing.translate ( this._position.x, this._position.y );
        this.graphicsForDrawing.rotate( this._velocity.angle() );
        
        this.graphicsForDrawing.scale( this.xScale, this.yScale );
    
        this.graphicsForDrawing.circle( 0, 0, this.radius );
        this.graphicsForDrawing.closePath();
        this.graphicsForDrawing.fill();
        this.graphicsForDrawing.stroke();


        this.graphicsForDrawing.restore();

    },    
 
    /**
    * checks if boid is in range of some other vector
    */
    isWithinRange: function( vector, range ) {
        if ( this._position.distance( vector ) < range )
            return true;
        else
            return false;
    },
    /**
    * Gets and sets the boid's mass - GETTER AND SETTER!
    */
    mass: function( value ) {
        if ( value ) {
            this._mass = value;
        } else {
            return this._mass;
        }   
    },

    /**
    * Gets and sets the max speed of the boid - GETTER AND SETTER!
    */
    maxSpeed: function( value ) {
        if ( value ) {
            this._maxSpeed = value;
        } else {
            return this._maxSpeed;
        }
    },

    /**
    *Gets and sets the position of the boid - GETTER AND SETTER!
    */
    position: function( value ) {
        if ( value ) {
            this._position = value;
        // this.x(this._position.x);
        // this.y(this._position.y);
        } else {
            return this._position;
        }
    },
    /**
    * Gets and sets the velocity of the boid - GETTER AND SETTER!
    */
    velocity: function( value ) {
        if ( value ) {
            this._velocity = value;
        } else {
            return this._velocity;
        }
    },
    getVector: function() {
        return this.position();
    },
    getPathIndex: function() {
        return this.pathIndex;
    }
}
/**
*Gets and sets the X position of the boid - GETTER AND SETTER!
*/
Object.defineProperty (Boid.prototype, "x", {
        get: function () { return this._position.x; },
        set: function ( new_value ) {
               this._position.x = new_value;
             }
});
/**
*Gets and sets the Y position of the boid - GETTER AND SETTER!
*/
Object.defineProperty (Boid.prototype, "y", {
        get: function () { return this._position.y; },
        set: function ( new_value ) {
               this._position.y = new_value;
             }
});
/**
*Gets and sets the X velocity of the boid - GETTER AND SETTER!
*/
Object.defineProperty (Boid.prototype, "vx", {
        get: function () { return this._velocity.x; },
        set: function ( new_value ) {
               this._velocity.x = new_value;
             }
});
/**
*Gets and sets the Y velocity of the boid - GETTER AND SETTER!
*/
Object.defineProperty (Boid.prototype, "vy", {
        get: function () { return this._velocity.y; },
        set: function ( new_value ) {
               this._velocity.y = new_value;
             }
});
/*
Original Author: com.rocketmandevelopment.math
Ported by: Michael Trouw
*/

/**
* Vector2D Constructor
*/
function Vector2D( x, y ) {
   
    this.self = this; // :Vector2D

    if ( x == undefined && y == undefined ){
        x = 0;
        y = 0;
    }
    this.x = x;
    this.y = y;
}

Vector2D.prototype = {
    /**
    * Creates an exact copy of this Vector2D
    * @return Vector2D A copy of this Vector2D
    */
    cloneVector: function() { // returns: Vector2D
        return new Vector2D( this.x, this.y );
    },
    /**
    * Makes x and y zero.
    * @return Vector2D This vector.
    */
    zeroVector: function() { // returns: Vector2D
        this.x = 0;
        this.y = 0;
        return this.self;
    },
    /**
    * Is this vector zeroed?
    * @return Boolean Returns true if zeroed, else returns false.
    */
    isZero: function() { // returns: Boolean
        return this.x == 0 && this.y == 0;
    },
    /**
    * Is the vector's length = 1?
    * @return Boolean If length is 1, true, else false.
    */
    isNormalized: function() { // returns: Boolean
        return this.length == 1.0;
    },
    /**
    * Does this vector have the same location as another?
    * @param vector2 The vector to test.
    * @return Boolean True if equal, false if not.
    */
    equals: function( vector2d ) {    // param: Vector2D returns: Boolean
        return this.x == vector2d.x() && this.y == vector2d.y();
    },
    /**
    * Sets the length which will change x and y, but not the angle and gets the length - GETTER AND SETTER!
    */
    length: function( value ) {   // param :Number
        if ( value ) {
            var _angle = this.angle();  // :Number
            this.x = Math.cos(_angle) * value;
            this.y = Math.sin(_angle) * value;
            if(Math.abs(this.x) < 0.00000001) this.x = 0;
            if(Math.abs(this.y) < 0.00000001) this.y = 0;
        } else {
            return Math.sqrt( this.lengthSquared() );
        }
    },
    /**
    * Returns the length of this vector, before square root. Allows for a faster check.
    */
    lengthSquared: function() {   // returns: Number GETTER!
        return this.x * this.x + this.y * this.y;
    },
    /**
    * Changes the angle of the vector. X and Y will change, length stays the same. Get the angle of this vector.
    */
    angle: function( value ) { //param: Number SETTER!
        if ( value ) {
            var len = this.length();    // :Number
            this.x = Math.cos( value ) * len;
            this.y = Math.sin( value ) * len;
        } else {
            return Math.atan2( this.y, this.x );
        }
    },

    /**
    * Sets the vector's length to 1.
    * @return Vector2D This vector.
    */
    normalize: function() {   // returns :Vector2D
        if ( this.length() == 0 ){
            this.x = 1;
            return this.self;
        }
        var len = this.length();    // :Number
        this.x /= len;
        this.y /= len;
        return this.self;
    },
    /**
    * Sets the vector's length to len.
    * @param len The length to set it to.
    * @return Vector2D This vector.
    */
    normalcate: function( len ) {   // param :Number returns :Vector2D
        this.length( len );
        return this.self;
    },
    /**
    * Sets the length under the given value. Nothing is done if the vector is already shorter.
    * @param max The max length this vector can be.
    * @return Vector2D This vector.
    */
    truncate: function( max ) { // param: Number returns :Vector2D
        this.length( Math.min( max, this.length() ) );
        return this.self;
    },
    /**
    * Makes the vector face the opposite way.
    * @return Vector2D This vector.
    */
    reverse: function() { // returns: Vector2D
        this.x = -this.x;
        this.y = -this.y;
        return this.self;
    },
    /**
    * Calculate the dot product of this vector and another.
    * @param vector2 Another vector2D.
    * @return Number The dot product.
    */
    dotProduct: function( vector2 ) {   // param: Vector2D returns :Number
        return this.x * vector2.x + this.y * vector2.y;
    },
    /**
    * Calculate the cross product of this and another vector.
    * @param vector2 Another Vector2D.
    * @return Number The cross product.
    */
    crossProd: function( vector2 ) {    // param :Vector2D returns :Number
        return this.x * vector2.y - this.y * vector2.x;
    },
    /**
    * Calculate angle between any two vectors.
    * @param vector1 First vector2d.
    * @param vector2 Second vector2d.
    * @return Number Angle between vectors.
    */
    angleBetween: function( vector1, vector2 ) {    // param1 :Vector2D, param2 :Vector2D, returns :Number
        if( !vector1.isNormalized() ) vector1 = vector1.cloneVector().normalize();
        if( !vector2.isNormalized() ) vector2 = vector2.cloneVector().normalize();
        return Math.acos( vector1.dotProduct( vector2 ));
    },
    /**
    * Is the vector to the right or left of this one?
    * @param vector2 The vector to test.
    * @return Boolean If left, returns true, if right, false.
    */
    sign: function( vector2 ) { // param :Vector2D returns: int
        return perpendicular.dotProduct( vector2 ) < 0 ? -1 : 1;
    },
    /**
    * Get the vector that is perpendicular.
    * @return Vector2D The perpendicular vector.
    */
    perpendicular: function() {   // returns: Vector2D GETTER!
        return new Vector2D( -this.y, this.x) ;
    },
    /**
    * Calculate between two vectors.
    * @param vector2 The vector to find distance.
    * @return Number The distance.
    */
    distance: function( vector2 ) { //param :Vector2D returns: Number
        //console.log(vector2);
        return Math.sqrt(this.distSQ( vector2 ));
    },
    /**
    * Calculate squared distance between vectors. Faster than distance.
    * @param vector2 The other vector.
    * @return Number The squared distance between the vectors.
    */
    distSQ: function( vector2 ) {   // param :Vector2D returns :Number
        //console.log(vector2);
        var dx = vector2.x - this.x;    // :Number
        var dy = vector2.y - this.y;    // :Number
        return ( dx * dx ) + ( dy * dy );
    },
    /**
    * Add a vector to this vector.
    * @param vector2 The vector to add to this one.
    * @return Vector2D This vector.
    */
    add: function( vector2 ) {  //param: Vector2D, returns: Vector2D
        this.x += vector2.x;
        this.y += vector2.y;
        return this.self;
    },
    /**
    * Returns the value of the given vector added to this.
    */
    // this method was taken from Shane McCartney's Vector 2D implementation
    copyAndAdd: function( vector2 ) {
        return new Vector2D( this.x + vector2.x, this.y + vector2.y );
    },
    /**
    * Subtract a vector from this one.
    * @param vector2 The vector to subtract.
    * @return Vector2D This vector.
    */
    subtract: function( vector2 ) { //param: Vector2D, returns: Vector2D
        this.x -= vector2.x;
        this.y -= vector2.y;
        return this.self;
    },
    /**
    * Returns the value of the given vector subtracted from this.
    * in other words: copy and subtract
    */
    // this method was taken from Shane McCartney's Vector 2D implementation
    copyAndSubtract: function( vector2 ) {
        return new Vector2D( this.x - vector2.x, this.y - vector2.y );
    },
    /**
    * Mutiplies this vector by another one.
    * @param scalar The scalar to multiply by.
    * @return Vector2D This vector, multiplied.
    */
    multiply: function( scalar ) {  //param: Number returns: Vector2D
        this.x *= scalar;
        this.y *= scalar;
        return this.self;
    },
    /**
    * Divide this vector by a scalar.
    * @param scalar The scalar to divide by.
    * @return Vector2D This vector.
    */
    divide: function( scalar ) {    //param:Number returns :Vector2D
        this.x /= scalar;
        this.y /= scalar;
        return this.self;
    },
    /**
    * Create a vector2D from a string
    * @param string The string to turn into a vector. Must be in the toString format.
    * @return Vector2D The vector from the string.
    **/
    fromString: function( string ) { // param: String returns: Vector2D
        var vector = new Vector2D();    // :Vector2D
        var tx; //:Number
        var ty; //:Number
        tx = parseInt( string.substr( string.indexOf( "x:" ), string.indexOf( "," ) ), 10 );
        ty = parseInt( string.substr( string.indexOf( "y:" ) ), 10 );
        vector.x = tx;
        vector.y = ty;
        return vector;
    },
    /**
    * Turn this vector into a string.
    * @return String This vector in string form.
    */
    toString: function() {    //returns: String
        return ("Vector2D x:" + this.x + ", y:" + this.y);
    },

    /**
    * Draw vector, good to see where its pointing.
    * @param graphicsForDrawing The graphics to draw the vector.
    * @param drawingColor The color to draw the vector in.
    */
    draw: function( graphicsForDrawing, strokeColor, lineWidth ) {  //param1:Graphics, param2: uint

        graphicsForDrawing.save();
        graphicsForDrawing.lineStyle( strokeColor, lineWidth );
        graphicsForDrawing.beginPath();
        graphicsForDrawing.moveTo( 0, 0 );
        graphicsForDrawing.lineTo( this.x, this.y );
        graphicsForDrawing.restore();
    },
    /**
    * Turns a non-zero vector into a vector of unit length.
    */
    unit: function() {
        var l = this.magnitude();

        if ( l !== 0 ) {
            this.x *= 1 / l;
            this.y *= 1 / l;
        }

        return this.self;
    },
    /**
    * Gets the magnitude of this vector.
    */
    magnitude: function() {
        return Math.sqrt( this.x * this.x + this.y * this.y );
    }

}

/**
* Graphics Constructor
*/
function Graphics( properties ) {
    
    this.context = properties.context;
    this.strokeStyle = ( properties.strokeStyle == undefined ) ? "#000" : properties.strokeStyle;
    this.fillStyle = ( properties.fillStyle == undefined ) ? "#00FF00" : properties.fillStyle; 
    this.lineWidth = ( properties.lineWidth == undefined ) ? 2 : properties.lineWidth;
  
    this.self = this;
}

Graphics.prototype = {
    /**
    * Draws line to context
    * @param lineWidth The width of the line
    * @param drawingColor The color of the line
    */
    lineStyle: function( strokeColor, lineWidth ) { 
        this.context.strokeStyle = ( strokeStyle == undefined ) ? this.strokeStyle : strokeStyle;
        this.context.lineWidth = ( lineWidth == undefined ) ? this.lineWidth : lineWidth;
        if ( this.context.lineWidth > 0 ) {
            this.context.stroke();
        }  
        return this.self; 
    },
    fillRect: function( x, y, width, height, fillStyle ) {  
        this.context.fillStyle = ( fillStyle == undefined ) ? this.fillStyle : fillStyle;
        this.context.fillRect( x, y, width, height );
        return this.self; 
    },
    strokeRect: function( x, y, width, height, strokeStyle ) {  
        this.context.strokeStyle = ( strokeStyle == undefined ) ? this.strokeStyle : strokeStyle;
        this.context.lineWidth = this.lineWidth;
        this.context.strokeRect( x, y, width, height );
        return this.self; 
    },
    fill: function( fillStyle ) {  
        this.context.fillStyle = ( fillStyle == undefined ) ? this.fillStyle : fillStyle;
        this.context.fill();
        return this.self; 
    },    
    stroke: function( strokeStyle ) { 
        this.context.strokeStyle = ( strokeStyle == undefined ) ? this.strokeStyle : strokeStyle;
        this.context.lineWidth = this.lineWidth;
        this.context.stroke();
        return this.self; 
    },            
    translate: function( x, y ) {
        this.context.translate( x, y);
        return this.self;
    },
    rotate: function( angle ) {
        this.context.rotate( angle );
        return this.self;
    },    
    moveTo: function( x, y ) {
        this.context.moveTo( x, y);
        return this.self;
    },
    beginPath: function() {
        this.context.beginPath();
        return this.self;  
    },
    closePath: function() {
        this.context.closePath();
        return this.self;  
    },   
    lineTo: function( x, y ) {
        this.context.lineTo( x, y);
        return this.self;
    },
    circle: function( x, y, radius ) {
        this.context.arc( x, y, radius, 0, Math.PI * 2, false );
        return this.self;
    }, 
    scale: function( x, y, radius ) {
        this.context.scale( x, y );
        return this.self;
    }, 
    quadraticCurveTo: function( cpx, cpy, x, y ) {
        this.context.quadraticCurveTo( cpx, cpy, x, y );
        return this.self;
    },
    bezierCurveTo: function( cp1x, cp1y, cp2x, cp2y, x, y ) {
        this.context.bezierCurveTo( cp1x, cp1y, cp2x, cp2y, x, y );
        return this.self;
    },     
    clear: function(){
        this.context.clearRect( this.x, this.y, this.width, this.height );
    },
    save: function(){
        this.context.save();
    },
    restore: function(){
        this.context.restore();
    }      

}


function Wander( properties ) {
    this.circleRadius = properties.circleRadius || 10;
    this.wanderAngle = properties.wanderAngle || 5;
    this.wanderChange = properties.wanderChange || 1;

    this.circleRadius = 5 + Math.random() * this.circleRadius;
    this.wanderAngle *= Math.random();
    this.wanderChange *= Math.random();
}
Wander.prototype = {
    force: function( velocity ) {
        var circleMiddle = velocity.cloneVector().normalize().multiply( this.circleRadius );
        var wanderForce = new Vector2D();
        wanderForce.length( 0.2 );
        wanderForce.angle( this.wanderAngle );
        this.wanderAngle += Math.random() * this.wanderChange - this.wanderChange * 0.5;
        var outputForce = circleMiddle.add( wanderForce );
        return outputForce;
    }
}
