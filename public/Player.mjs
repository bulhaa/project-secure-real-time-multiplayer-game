class Player {
  constructor({x, y, score, id, ctx, canvas}) {
    this.position = {x, y};
    this.score = score;
    this.id = id;
    this.ctx = ctx;
    this.canvas = canvas;
    this.velocity = {x:0, y:0};
    this.width = 20;
    this.height = 20;
  }

  movePlayer(dir, speed) {
    if(dir === 'up') {
      this.y -= speed;
    } else if(dir === 'down') {
      this.y += speed;
    } else if(dir === 'left') {
      this.x -= speed;
    } else if(dir === 'right') {
      this.x += speed;
    }

  }

  collision(item) {
    return (this.x < item.x + item.width &&
      this.x + this.width > item.x &&
      this.y < item.y + item.height &&
      this.height + this.y > item.y);
  }

  calculateRank(arr) {  
    arr.sort((a, b) => b.score - a.score);
    return `Rank: ${arr.indexOf(this) + 1}/${arr.length}`;
  }

  draw() {
    this.ctx.fillStyle = "#99c9ff";
    this.ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
  
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    const gravity = 1

    if (this.position.y + this.height + this.velocity.y <= this.canvas.height) {
      if (this.position.y < 0) {
        this.position.y = 0;
      }
    } else {
      this.velocity.y = 0;
    }

    if (this.position.x < this.width) {
      this.position.x = this.width;
    }

    if (this.position.x >= this.canvas.width - 2 * this.width) {
      this.position.x = this.canvas.width - 2 * this.width;
    }
  }
}

export default Player;
