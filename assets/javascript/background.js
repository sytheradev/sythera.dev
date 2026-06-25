function initCanvasParticles() {
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let particles = [];
let animationId = null;
let canvasWidth = 0;
let canvasHeight = 0;
let particlesInitialized = false;
let currentDeviceType = null;

function isMobileDevice() {
    return window.innerWidth <= 768;
}

function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    const newDeviceType = isMobileDevice() ? 'mobile' : 'desktop';
    const deviceTypeChanged = currentDeviceType !== null && currentDeviceType !== newDeviceType;
    
    const scaleX = canvasWidth > 0 ? newWidth / canvasWidth : 1;
    const scaleY = canvasHeight > 0 ? newHeight / canvasHeight : 1;
    
    canvas.style.width = newWidth + 'px';
    canvas.style.height = newHeight + 'px';
    
    canvas.width = newWidth * dpr;
    canvas.height = newHeight * dpr;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    
    canvasWidth = newWidth;
    canvasHeight = newHeight;

    if (!particlesInitialized || deviceTypeChanged) {
        particles = [];
        
        const particleCount = newDeviceType === 'mobile' ? 80 : 150;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle(newDeviceType === 'mobile'));
        }
        
        particlesInitialized = true;
        currentDeviceType = newDeviceType;
    } else {
        if (particles.length > 0 && (scaleX !== 1 || scaleY !== 1)) {
            particles.forEach(particle => {
                particle.x *= scaleX;
                particle.y *= scaleY;
            });
        }
    }
}

class Particle {
    constructor(isMobile = false) {
        const width = canvasWidth > 0 ? canvasWidth : window.innerWidth;
        const height = canvasHeight > 0 ? canvasHeight : window.innerHeight;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = isMobile ? (1.5 + Math.random() * 2.5) : (1 + Math.random() * 2);
        this.baseOpacity = 0.2 + Math.random() * 0.5;
        this.opacity = this.baseOpacity;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.twinkleSpeed = 0.02 + Math.random() * 0.03;
        this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < 0) this.x = canvasWidth;
        if (this.x > canvasWidth) this.x = 0;
        if (this.y < 0) this.y = canvasHeight;
        if (this.y > canvasHeight) this.y = 0;
        
        this.twinkleOffset += this.twinkleSpeed;
        this.opacity = this.baseOpacity * (0.5 + 0.5 * Math.sin(this.twinkleOffset));
    }

    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

resizeCanvas();

function animate() {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    animationId = requestAnimationFrame(animate);
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        resizeCanvas();
        updateFloatingShapes();
        animate();
    }, 100);
});

animate();

let mouseX = 0;
let mouseY = 0;
let ticking = false;

function updateCorners() {
    const corners = document.querySelectorAll('.corner');
    corners.forEach((corner) => {
        const rect = corner.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = (mouseX - centerX) * 0.02;
        const deltaY = (mouseY - centerY) * 0.02;
        
        corner.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    });
    ticking = false;
}

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!ticking) {
        requestAnimationFrame(updateCorners);
        ticking = true;
    }
});
}

function updateFloatingShapes() {
    const shapes = document.querySelectorAll('.shape');
    const isMobile = window.innerWidth <= 768;
    
    shapes.forEach(shape => {
        if (isMobile) {
            shape.classList.remove('visible');
        } else {
            shape.classList.add('visible');
        }
    });
}

function initFloatingShapes() {
    updateFloatingShapes();
}

function initBackground() {
    initCanvasParticles();
    initFloatingShapes();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackground);
} else {
    initBackground();
}