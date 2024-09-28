class Star {
    constructor(x, y, size, speed) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
    }

    move() {
        this.y += this.speed;
        if (this.y > canvas.height) {
            this.y = 0;
        }
    }

    draw() {
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let stars = [];

function initStars() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    const numStars = Math.floor(canvas.width * canvas.height / 1000);
    for (let i = 0; i < numStars; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        const speed = 0.1 + Math.random() * 0.3;
        stars.push(new Star(x, y, size, speed));
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => {
        star.move();
        star.draw();
    });
    requestAnimationFrame(animate);
}

window.addEventListener('resize', initStars);
initStars();
animate();
