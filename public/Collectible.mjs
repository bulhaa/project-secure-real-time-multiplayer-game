class Collectible {
  constructor({x, y, value, id, ctx}) {
    this.position = {x, y};
    this.value = value;
    this.id = id;
    this.ctx = ctx;
    this.width = 20;
    this.height = 20;
  }

  draw() {
    this.ctx.fillStyle = "#acd157";
    this.ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }

}

/*
  Note: Attempt to export this for use
  in server.js
*/
try {
  module.exports = Collectible;
} catch(e) {}

export default Collectible;
