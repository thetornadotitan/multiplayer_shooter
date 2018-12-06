class Player{

	constructor(){
		this.up = false;
		this.down = false;
		this.left = false;
		this.right = false;
	}
	
	update(){
		let data = {
			id : socket.id,
			up : this.up,
			down : this.down,
			left : this.left,
			right: this.right
		}
		socket.emit('updatePlayer', data);
	}
	
}