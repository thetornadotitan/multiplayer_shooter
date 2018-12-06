//Setup Server
process.title = "mTest";
const express = require('express');
const app = express();
const server = app.listen(3000);
const socket = require('socket.io');
const io = socket(server);
app.use(express.static('public'));

//GameLogic - variables
const gameSpace = {x: 2000, y: 2000};
let playerCount = 0;
let players = {};
let debris = [];
let bullets = [];
setInterval(heartbeat, 16.66666666666667);

//Messages
io.sockets.on('connection', newConnection);

//functions
function newConnection(socket){
	console.log(socket.id + " connected");
	playerCount++;
	socket.on('disconnect', function(){
		playerCount--;
		delete players[socket.id];
		io.sockets.emit('updatePlayers', players);
		console.log(socket.id + " disconnected");
	});
	
	socket.on('updatePlayer', updatePlayer);
	socket.on('fire', playerFired);
	
	let player = {
		id : socket.id,
		x : getRndInteger(-gameSpace.x + 100, gameSpace.x-99),
		y : getRndInteger(-gameSpace.y + 100, gameSpace.y-99),
		col : {
			r : getRndInteger(100, 255),
			g : getRndInteger(100, 255),
			b : getRndInteger(100, 255),
			a : 255,
		},
		r : 24,
		d : 48,
		speed : 5,
		health: 100,
		alive: true,
		lastFire: 0,
		kills: 0,
		wins: 0
	};
	
	players[socket.id] = player;
	io.sockets.emit('updatePlayers', players);
	socket.emit('initPlayer', {});
}

function updatePlayer(data){
	try{
		if(data.left  == true) players[data.id].x -= players[data.id].speed;
		if(data.right == true) players[data.id].x += players[data.id].speed;
		
		if(data.up    == true) players[data.id].y -= players[data.id].speed;
		if(data.down  == true) players[data.id].y += players[data.id].speed;
		
		if(players[data.id].x > gameSpace.x - players[data.id].r){
			players[data.id].x = gameSpace.x - players[data.id].r;
		}
		if(players[data.id].x < -gameSpace.x + players[data.id].r){
			players[data.id].x = -gameSpace.x + players[data.id].r;
		}
		
		if(players[data.id].y > gameSpace.y - players[data.id].r){
			players[data.id].y = gameSpace.y - players[data.id].r;
		}
		if(players[data.id].y < -gameSpace.y + players[data.id].r){
			players[data.id].y = -gameSpace.y + players[data.id].r;
		}
	}catch(err){
		console.log(err.message);
	}
}

function playerFired(data){
	try{
		let pData = players[data.id];
		if(Math.abs(pData.lastFire - Date.now()) >= 333 && pData.alive){
			pData.lastFire = Date.now();
			bullets.push(new Bullet(pData.x, pData.y, data.angle, {r: pData.col.r, g: pData.col.g, b: pData.col.b}, pData.id));
		}
	}catch(err){
		console.log(err.message);
	}
}

function heartbeat(){
	io.sockets.emit('updateGameData', {gameSpace})
	io.sockets.emit('updatePlayers', players);
	updateDebris();
	io.sockets.emit('updateDebris', debris);
	updateBullets();
	io.sockets.emit('updateBullets', bullets);
}

function updateBullets(){
	if(bullets.length > 0){
		for (let i = bullets.length-1; i >= 0; i--){
			try{
				if(bullets.length <= 0) break;
				if(bullets[i].x < -gameSpace.x - 1000 || bullets[i].x > gameSpace.x + 1000 || bullets[i].y < -gameSpace.y - 1000 || bullets[i].y > gameSpace.y + 1000){
					bullets.splice(i, 1);
					continue;
				}
				bullets[i].x += bullets[i].velX;
				bullets[i].y += bullets[i].velY;
				for(let entity in players){
					let data = players[entity];
					if((bullets[i].x - data.x) * (bullets[i].x - data.x) + (bullets[i].y - data.y) * (bullets[i].y - data.y) <= data.r * data.r + bullets[i].r * bullets[i].r){
						if(data.alive && bullets[i].owner != data.id){
							data.health -= bullets[i].d * 2;
							if(data.health <= 0){
								players[bullets[i].owner].kills++;
								data.alive = false;
								if ( checkAlive() ) break;
							}
							bullets.splice(i, 1);
							continue;
						}
					}
				}
			}catch(err){
				continue;
			}
		}
	}
}

function updateDebris(){
	if(debris.length < playerCount * 20){debris.push(new Debris());}
	
	if(debris.length > 0){
		for (let i = debris.length-1; i >= 0; i--){
			try{
				if(debris.length <= 0) break;
				if(debris[i].x < -gameSpace.x - 1000 || debris[i].x > gameSpace.x + 1000 || debris[i].y < -gameSpace.y - 1000 || debris[i].y > gameSpace.y + 1000){
					debris.splice(i, 1);
					continue;
				}
				debris[i].x += debris[i].velX;
				debris[i].y += debris[i].velY;
				for(let entity in players){
					let data = players[entity];
					if((debris[i].x - data.x) * (debris[i].x - data.x) + (debris[i].y - data.y) * (debris[i].y - data.y) <= data.r * data.r + debris[i].r * debris[i].r){
						if(data.alive){
							data.health -= debris[i].d;
							if(data.health <= 0){
								data.alive = false;
								if ( checkAlive() ) break;
							}
							debris.splice(i, 1);
							continue;
						}
					}
				}
			}catch(err){
				continue;
			}
		}
	}
}

function checkAlive(){
	
	let alive = 0;
	
	for(let entity in players){
		let data = players[entity];
		if(data.alive) alive++;
		if(alive > 1) return false;
		if(playerCount == 1 && alive == 1) return false;
	}
	
	debris = [];
	bullets = [];
	
	for(let entity in players){
		let data = players[entity];
		if(data.alive) data.wins++;
		data.health = 100;
		data.alive = true;
		data.x = getRndInteger(-gameSpace.x + 100, gameSpace.x-99);
		data.y = getRndInteger(-gameSpace.y + 100, gameSpace.y-99);
	}
	
	return true;
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

//Function Listing:
/*

newConnection      -   Add data to server regarding the new connection & client
removeConnection   -   Gracefully remove data for disconnected client
updatePlayer       -   Update player using client safe data
updateBullets      -   Update bullet position and check collisions
updateDebris       -   Spawn and move debris
playerFired        -   Spawn bullet
checkAlive         -   If all players are dead than restart game
heartbeat          -   Update everyone on the server with needed info
getRndInteger      -   A nice function to get a random int

*/

class Debris {
	
	constructor(){
		this.x = (getRndInteger(0,2) == 0) ? (-gameSpace.x - 999) : (gameSpace.x + 999);
		this.y = (getRndInteger(0,2) == 0) ? (-gameSpace.y - 999) : (gameSpace.y + 999);
		this.trgX = getRndInteger(-gameSpace.x, gameSpace.x);
		this.trgY = getRndInteger(-gameSpace.y, gameSpace.y);
		this.dx = this.trgX - this.x;
		this.dy = this.trgY - this.y;
		this.angle = Math.atan2(this.dy, this.dx);
		this.col = {
			r : 175,
			g : 175,
			b : 175,
			a : 255,
		};
		this.r = 4;
		this.d = 8;
		this.speed = getRndInteger(5, 20);
		this.velX = this.speed * Math.cos(this.angle);
		this.velY = this.speed * Math.sin(this.angle);
	}
}

class Bullet {
	
	constructor(px, py, angle, clr, owner){
		this.x = px;
		this.y = py;
		this.angle = angle;
		this.col = {
			r : clr.r,
			g : clr.g,
			b : clr.b,
			a : 255,
		};
		this.r = 4;
		this.d = 8;
		this.speed = 10;
		this.velX = this.speed * Math.cos(this.angle);
		this.velY = this.speed * Math.sin(this.angle);
		this.owner = owner;
	}
}