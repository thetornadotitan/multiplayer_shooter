//Variables:
let socket;
let gameData;
let player;
let players;
let debris;

let stars;
let nebulea;

//Rendering:
function setup(){
	createCanvas(windowWidth,windowHeight);
	socket = io.connect('http://justicemoose.com:3000');
	
	socket.on('initPlayer',     function(data){ player = new Player(); });
	socket.on('updateDebris',   function(data){ debris = data; });
	socket.on('updatePlayers',  function(data){ players = data; });
	socket.on('updateBullets',  function(data){ bullets = data; })
	socket.on('updateGameData', function(data){ gameData = data;});
	
	stars = [];
	nebulea = [];
}

function draw(){
	background(0);

	setupBackground(); // Ran once - needs to be here as it is dependant on server data that may not be avilable in setup.

	//Make sure all needed data is available
	if(player && players && gameData && stars && nebulea){
		push();
		translate(width/2-players[socket.id].x, height/2-players[socket.id].y);

		drawNebulae();
		drawStars();

		drawPlayers();
		drawDebris();
		drawBullets();
		checkInput();

		player.update();

		pop();
		drawUI();
	}
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

//Input:
function keyPressed(){
	if(player){
		if(key == 'w' || key =='W' || keyCode == UP_ARROW)  player.up     = true;
		if(key == 's' || key =='S' || keyCode == DOWN_ARROW)player.down   = true;
		
		if(key == 'a' || key =='A' || keyCode == LEFT_ARROW) player.left  = true;
		if(key == 'd' || key =='D' || keyCode == RIGHT_ARROW)player.right = true;
	}
}

function keyReleased(){
	if(player){
		if(key == 'w' || key =='W' || keyCode == UP_ARROW)  player.up     = false;
		if(key == 's' || key =='S' || keyCode == DOWN_ARROW)player.down   = false;
		
		if(key == 'a' || key =='A' || keyCode == LEFT_ARROW) player.left  = false;
		if(key == 'd' || key =='D' || keyCode == RIGHT_ARROW)player.right = false;
	}
}

function drawNebulae(){
	noStroke();
	for(let nebula of nebulea){
		if( nebula.x + nebula.r >= players[socket.id].x - width/2 - 100 && 
			nebula.x - nebula.r <= players[socket.id].x + width/2 + 100 && 
			nebula.y + nebula.r >= players[socket.id].y - height/2 -100 && 
			nebula.y - nebula.r <= players[socket.id].y + height/2 +100)
		{
			fill(nebula.col.r, nebula.col.g, nebula.col.b, nebula.col.a);
			ellipse(nebula.x, nebula.y, nebula.r*2);
		}
	}
}

function setupBackground(){
	if(gameData){
		if(stars.length < 1 || nebulea.length < 1){
			for(let i = 0; i < 1000; i++){
				stars.push({
					 x : random(-gameData.gameSpace.x, gameData.gameSpace.x),
					 y : random(-gameData.gameSpace.y, gameData.gameSpace.y),
				});
			}
		
			for(let i = 0; i < 100; i++){
				nebulea.push({
					x : random(-gameData.gameSpace.x, gameData.gameSpace.x),
					y : random(-gameData.gameSpace.y, gameData.gameSpace.y),
					r : random(100, 400),
					col : {
						r : random(0, 255),
						g : random(0, 255),
						b : random(0, 255),
						a : 25
					}
			   });
			}
		}
	}
}

function drawStars(){
	stroke(255);
	strokeWeight(2);
	fill(255);

	for(let star of stars){
		if( star.x >= players[socket.id].x - width/2 - 100 && 
			star.x <= players[socket.id].x + width/2 + 100 && 
			star.y >= players[socket.id].y - height/2 -100 && 
			star.y <= players[socket.id].y + height/2 +100)
		{
			point(star.x, star.y);
		}
	}

	noStroke();
}

function drawPlayers(){
	for(let entity in players){
		let data = players[entity];
		if(data.alive){
			fill(data.col.r, data.col.g, data.col.b);
			ellipse(data.x, data.y, data.d);
			fill(map(data.health, 0, 100, 255, 0), map(data.health, 0, 100, 0, 255), 0);
			rect(data.x - data.r, data.y + data.r + 3, map(data.health, 0, 100, 0, data.d), 15);
			if(data.id != socket.id){
				let me = players[socket.id];
				strokeWeight(1);
				stroke(data.col.r, data.col.g, data.col.b);
				line(data.x, data.y, me.x, me.y);
				noStroke();
			}
		}
	}
}

function drawDebris(){
	if(debris.length > 0){
		fill(debris[0].col.r, debris[0].col.g, debris[0].col.b);
	}
	for(let debri of debris){
		if( debri.x + debri.r >= players[socket.id].x - width/2 - 100 && 
			debri.x - debri.r <= players[socket.id].x + width/2 + 100 && 
			debri.y + debri.r >= players[socket.id].y - height/2 - 100 && 
			debri.y - debri.r <= players[socket.id].y + height/2 + 100)
		{
			ellipse(debri.x, debri.y, debri.d);
		}
	}
}

function drawBullets(){
	for(let bullet of bullets){
		if( bullet.x + bullet.r >= players[socket.id].x - width/2 - 100 && 
			bullet.x - bullet.r <= players[socket.id].x + width/2 + 100 && 
			bullet.y + bullet.r >= players[socket.id].y - height/2 - 100 && 
			bullet.y - bullet.r <= players[socket.id].y + height/2 + 100)
		{
			fill(bullet.col.r, bullet.col.g, bullet.col.b);
			ellipse(bullet.x, bullet.y, bullet.d);
		}
	}
}

function checkInput(){
	if(mouseIsPressed){
		let trgX = mouseX;
		let trgY = mouseY;
		let dx = trgX - windowWidth/2;
		let dy = trgY - windowHeight/2;
		let angle = Math.atan2(dy, dx);
		socket.emit('fire', {id: socket.id, angle: angle})
	}
}

function drawUI(){
	let killsColumn = 10 + (socket.id.length) * textSize();
		let leaderBoard = [];

		for(let entity in players){
			let data = players[entity];
			leaderBoard.push({ id : data.id, kills : data.kills, wins : data.wins });
		}

		text("Wins", 10, 10); text("Kills", killsColumn, 10);

		let scoreCount = 0;
		leaderBoard.sort(function(a,b) {return b.wins - a.wins});
		for(let p of leaderBoard){
			if(p.id == socket.id) fill(0, 255, 0);
			text(p.id + " - "  + p.wins, 10, 20 + (20 * scoreCount) + 10);
			if(p.id == socket.id) fill(255);
			scoreCount++;
		}

		scoreCount = 0;
		leaderBoard.sort(function(a,b) {return b.kills - a.kills});
		for(let p of leaderBoard){
			if(p.id == socket.id) fill(0, 255, 0);
			text(p.id + " - "  + p.kills, killsColumn, 20 + (20 * scoreCount) + 10);
			if(p.id == socket.id) fill(255);
			scoreCount++;
		}

		textAlign(RIGHT, BOTTOM);
		text(players[socket.id].x + ", " + players[socket.id].y, width - 10, height - 10);
		textAlign(LEFT, TOP);
}
