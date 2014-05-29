/**
 * Agent constructor
 * 
 * @param {Object} init with properties listed
 */
function Agent( init ){
    this.x = ( typeof init.x !== 'undefined' ) ? init.x :  canvas.width / 2;
    this.y = ( typeof init.y !== 'undefined' ) ? init.y :  canvas.height / 2;
    this.vx = ( typeof init.vx !== 'undefined' ) ? init.vx :  0;
    this.vy = ( typeof init.vy !== 'undefined' ) ? init.vy :  0;
    this.maxSpeed = ( typeof init.maxSpeed !== 'undefined' ) ? init.maxSpeed :  4;
    this.maxAcceleration = ( typeof init.maxAcceleration !== 'undefined' ) ? init.maxAcceleration :  2;
    this.rotation = ( typeof init.rotation !== 'undefined' ) ? init.rotation :  0;
    this.radius = ( typeof init.radius !== 'undefined' ) ? init.radius :  25;
    this.color = ( typeof init.color !== 'undefined' ) ? init.color :  '#AAA';
    this.strokeColor = ( typeof init.strokeColor !== 'undefined' ) ? init.strokeColor :  '#000';
    this.lineWidth = ( typeof init.lineWidth !== 'undefined' ) ? init.lineWidth :  3;
    this.gunWidth = ( typeof init.gunWidth !== 'undefined' ) ? init.gunWidth :  14;
    this.gunHeight = ( typeof init.gunHeight !== 'undefined' ) ? init.gunHeight :  28;
}

Agent.prototype = {
    // update agent's orientation and position based on steering forces
    // and current velocity.    
    updatePhysics: function( steeringForce ) {
        this.x += this.vx;
        this.y += this.vy;
                
        this.vx += steeringForce.linearX;
        this.vy += steeringForce.linearY;
            
        var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        
        if (speed > 0 && speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        
        //orient to current velocity
        this.rotation = Math.atan2(this.vy, this.vx);   
    },
    // render agent to canvas.
    draw: function( context ) {
        context.save();
        context.lineWidth = this.lineWidth;
        context.fillStyle = this.color;
        context.strokeStyle = this.strokeColor;
        
        context.translate ( this.x, this.y );
        context.rotate( this.rotation );

        //draw circular gun base
        context.beginPath();
        //x, y, radius, start_angle, end_angle, anti-clockwise
        context.arc( 0, 0, this.radius, 0, (Math.PI * 2), true );
        context.closePath();
        context.fill();
        if (this.lineWidth > 0) {
            context.stroke();
        }
        //draw rectangular gun
        context.translate( 0, - this.gunWidth / 2 );
        context.fillRect( 0, 0, this.gunHeight, this.gunWidth);
        context.strokeRect( 0, 0, this.gunHeight, this.gunWidth);
        context.restore();
    }
}; 

/**
 * SteeringForce constructor
 * 
 * accumlates influences of all steering behaviors.
 */
function SteeringForce() {
    this.linearX = 0;
    this.linearY = 0;
}
/**
 * Waypoint constructor
 * 
 */
function Waypoint ( x, y, radius, color ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = utils.parseColor( color );
}
Waypoint.prototype.draw = function ( context ) {
    context.save();
    context.strokeStyle = "purple";
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
    context.stroke();
    context.fill();
    context.restore();
}
/**
 * Particle constructor
 * 
 */
function Particle( x, y, radius, color ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = utils.parseColor( color );
    this.friction = 0.9;
    this.bounce = -0.6;
    this.gravity = 0.25;

    //randomize the velocity of the pieces to look like explosion
    this.vx = utils.getRandomFloat( -5, 5 );
    this.vy = utils.getRandomFloat( -5, 5 );
}

Particle.prototype.draw = function ( context ) {
    context.save();
    context.strokeStyle = "purple";
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
    context.stroke();
    context.fill();
    context.restore();
}

Particle.prototype.update = function () {
    //check if piece is at bottom of canvas
    if (this.y > canvas.height - (this.radius + 1)) {   
        this.y = canvas.height - (this.radius + 1);  //+1 to make it look nice, otherwise it was slightly clipped
        this.vy *= this.bounce;
        //apply friction only when piece is on the floor
        this.vx *= this.friction;
        this.vy *= this.friction;
    } else {
        this.vy += this.gravity;
    }
    //check if piece is hitting either side of canvas
    if (this.x > canvas.width - this.radius || this.x < 0 + this.radius) {   
        this.vx *= -1;
    } 
    
    this.x += this.vx;
    this.y += this.vy;

}