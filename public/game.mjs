import Player from './Player.mjs';
import Collectible from './Collectible.mjs';

const socket = io();
const canvas = document.getElementById('game-window');
const ctx = canvas.getContext('2d');

let isCollectibleCollisionDetectionActive = true;

const proportionalSize = (size) => {
    return innerHeight < 500 ? Math.ceil((size / 500) * innerHeight) : size;
}

const collectible = new Collectible({ x: 200, y: 200, value: 10, id: 1, ctx });
let player = new Player({ x: 300, y: 200, score: 10, id: 1, ctx, canvas });
let players = [player];
let userId = ""
fetch("http://localhost:3000/user", {
  "method": "GET"
}).then(res => res.json()).then(data => {
    userId = data.id
})



socket.on('user', data => {
    console.log('data: ', data);
});

socket.on('move', playersData => {
    console.log('playersData: ', playersData);

    playersData.forEach(playersDataEl => {
        let playerFound = players.find(playersEl => playersDataEl.id === playersEl.id)
        if (!playerFound) {
            if (!(playersDataEl.id === userId)) {
                const newPlayer = new Player({ x: playersDataEl.position.x, y: playersDataEl.position.y, score: playersDataEl.score, id: playersDataEl.id, ctx, canvas });
                players.push(newPlayer)
            }
        } else {
            playerFound.position = playersDataEl.position;
        }
    });
    let duplicate = players.find(playersEl => player.position.x === playersEl.position.x && player.position.y === playersEl.position.y)
    if(duplicate) {
        player = duplicate
        removeItemOnce(players, duplicate);
    }
})

function removeItemOnce(arr, value) {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    }
    return arr;
}

const animate = () => {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    collectible.draw();

    player.update();

    players.forEach(p => {
        p.update();
    });

    if (keys.rightKey.pressed && player.position.x < proportionalSize(400)) {
        player.velocity.x = 5;
    } else if (keys.leftKey.pressed && player.position.x > proportionalSize(100)) {
        player.velocity.x = -5;
    } else {
        player.velocity.x = 0;
    }

    if (keys.downKey.pressed && player.position.y < proportionalSize(400)) {
        player.velocity.y = 5;
    } else if (keys.upKey.pressed && player.position.y > proportionalSize(100)) {
        player.velocity.y = -5;
    } else {
        player.velocity.y = 0;
    }

    const collectibleDetectionRules = [
        player.position.x >= collectible.position.x,
        player.position.y >= collectible.position.y,
        player.position.y + player.height <=
        collectible.position.y + collectible.height,
        isCollectibleCollisionDetectionActive,
        player.position.x - player.width <=
        collectible.position.x - collectible.width + player.width * 0.9,
    ];

    if (collectibleDetectionRules.every((rule) => rule)) {
        collectible.claim();




    };
}

const keys = {
    rightKey: {
        pressed: false
    },
    leftKey: {
        pressed: false
    },
    upKey: {
        pressed: false
    },
    downKey: {
        pressed: false
    }
};

const movePlayer = (key, xVelocity, isPressed) => {
    if (!isCollectibleCollisionDetectionActive) {
        player.velocity.x = 0;
        player.velocity.y = 0;
        return;
    }

    switch (key) {
        case "ArrowLeft":
            keys.leftKey.pressed = isPressed;
            if (xVelocity === 0) {
                player.velocity.x = xVelocity;
            }
            player.velocity.x -= xVelocity;
            break;
        case "ArrowUp":
            keys.upKey.pressed = isPressed;
            if (xVelocity === 0) {
                player.velocity.y = xVelocity;
            }
            player.velocity.y -= xVelocity;
            break;
        case "ArrowDown":
            keys.downKey.pressed = isPressed;
            if (xVelocity === 0) {
                player.velocity.y = xVelocity;
            }
            player.velocity.y += xVelocity;
            break;
        case " ":
        case "Spacebar":
            player.velocity.y -= 8;
            break;
        case "ArrowRight":
            keys.rightKey.pressed = isPressed;
            if (xVelocity === 0) {
                player.velocity.x = xVelocity;
            }
            player.velocity.x += xVelocity;
            break;
        // default:
        //     return
        //     break;


    }
    socket.emit('move', player);
}


animate();



window.addEventListener("keydown", ({ key }) => {
    movePlayer(key, 8, true);
});

window.addEventListener("keyup", ({ key }) => {
    movePlayer(key, 0, false);
});
