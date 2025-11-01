if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = screen.width;
canvas.height = screen.height;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = 1 + Math.random() * 2;
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
        
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
        
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

const particles = [];
const particleCount = screen.width > 768 ? 150 : 80;

for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

function animate() {
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    requestAnimationFrame(animate);
}

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

const floatingShapes = document.querySelectorAll('.shape');

function updateFloatingShapes() {
    const scrollY = window.scrollY;
    
    floatingShapes.forEach((shape, index) => {
        shape.classList.add('visible');
        
        const speed = 0.3 + (index * 0.1);
        const offset = scrollY * speed;
        
        shape.style.transform = `translateY(${offset}px)`;
    });
}

window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    
    const loader = document.getElementById('loader');
    const mainContent = document.getElementById('mainContent');
    const title = document.querySelector('.title');
    
    setTimeout(() => {
        loader.classList.add('fade-out-text');
    }, 600);
    
    setTimeout(() => {
        loader.classList.add('fade-out');
        mainContent.classList.add('loaded');
        document.body.classList.remove('loading');
        updateFloatingShapes();
        
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }, 1000);
    
    setTimeout(() => {
        title.classList.add('active');
    }, 2000);
    
    const languageSwitcher = document.querySelector('.language-switcher');
    if (window.scrollY <= 50) {
        languageSwitcher.classList.add('show');
    } else {
        languageSwitcher.classList.add('hidden');
    }
    
    setTimeout(() => {
        const scrollIndicator = document.getElementById('scrollIndicator');
        
        if (window.scrollY <= 50) {
            scrollIndicator.classList.add('show');
        } else {
            scrollIndicator.classList.add('hidden');
        }
    }, 3000);
});

document.querySelector('.telegram-link').addEventListener('click', function() {
    const url = this.getAttribute('data-url');
    window.location.href = url;
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.content-section').forEach(section => {
    observer.observe(section);
});

const scrollIndicator = document.getElementById('scrollIndicator');
const languageSwitcher = document.querySelector('.language-switcher');
const allCorners = document.querySelectorAll('.corner');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    const isMobile = window.innerWidth <= 768;
    
    updateFloatingShapes();
    
    if (currentScrollY > 50) {
        scrollIndicator.classList.remove('show');
        scrollIndicator.classList.add('hidden');
        languageSwitcher.classList.remove('show');
        languageSwitcher.classList.add('hidden');
    } else {
        scrollIndicator.classList.remove('hidden');
        scrollIndicator.classList.add('show');
        languageSwitcher.classList.remove('hidden');
        languageSwitcher.classList.add('show');
    }
    
    if (isMobile) {
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
            allCorners.forEach(corner => corner.classList.add('hidden'));
        } else if (currentScrollY < 50) {
            allCorners.forEach(corner => corner.classList.remove('hidden'));
        }
    }
    
    lastScrollY = currentScrollY;
});

const bottomCorners = document.querySelectorAll('.corner-bl, .corner-br');
const footer = document.querySelector('.footer');

function updateFooterVisibility() {
    const footerRect = footer.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const isMobile = window.innerWidth <= 768;
    
    if (!isMobile) {
        if (footerRect.top < viewportHeight + 100) {
            bottomCorners.forEach(corner => corner.classList.add('hidden'));
        } else {
            bottomCorners.forEach(corner => corner.classList.remove('hidden'));
        }
    }
}

window.addEventListener('scroll', updateFooterVisibility);
updateFooterVisibility();

const translations = {
    en: {
        telegram: 'Telegram Channel',
        scrollDown: 'scroll down',
        services: 'services',
        about: 'about',
        
        websitesTitle: 'Websites',
        websitesDesc: 'Modern, responsive websites with beautiful design and high performance. From landing pages to complex web platforms.',
        
        botsTitle: 'Telegram Bots',
        botsDesc: 'Convenient bots for automation, sales, customer support, and business processes. Integration with websites and payment systems — including cryptocurrency.',        
        
        appsTitle: 'Servers',
        appsDesc: 'Professional setup and administration of servers for bots and websites. VPS/Dedicated configuration, security, auto-backups, and 24/7 monitoring.',

        aboutText: 'We are a team of developers that creates effective digital solutions for business. Our expertise covers web development, Telegram bots, and server infrastructure. We prioritize code quality, security, and performance in every project, delivering reliable, fast, and scalable solutions for our clients. With years of experience in modern technologies, we constantly seek new approaches, optimize processes, and implement innovations so the result not only meets expectations but exceeds them.',

        footerDev: 'Development',
        footerDevText: 'Websites, Bots & Servers<br>for your business',
        footerStats: 'Statistics',
        footerProjects: '50+ Projects',
        footerClients: '30+ Clients',
        footerYears: '3+ Years Experience',
        footerContact: 'Contact'
    },
    uk: {
        telegram: 'Telegram Канал',
        scrollDown: 'прокрутити вниз',
        services: 'послуги',
        about: 'про нас',
        
        websitesTitle: 'Сайти',
        websitesDesc: 'Сучасні, адаптивні сайти з красивим дизайном та високою продуктивністю. Від лендингів до складних веб-платформ.',
        
        botsTitle: 'Telegram Боти',
        botsDesc: 'Зручні боти для автоматизації, продажу, підтримки клієнтів та бізнес-процесів. Інтеграція з сайтами, платіжними системами — включаючи криптовалюту.',
        
        appsTitle: 'Сервери',
        appsDesc: 'Професійне налаштування та адміністрування серверів для ботів і сайтів. Конфігурація VPS/Dedicated, безпека, автобекапи та моніторинг 24/7.',
        
        aboutText: 'Ми — команда розробників, що створює ефективні цифрові рішення для бізнесу. Наша експертиза охоплює веб-розробку, Telegram-боти та серверну інфраструктуру. Ми надаємо пріоритет якості коду, безпеці та продуктивності в кожному проєкті, забезпечуючи надійні, швидкі та масштабовані рішення для наших клієнтів. З багаторічним досвідом у сучасних технологіях ми завжди шукаємо нові підходи, оптимізуємо процеси та впроваджуємо інновації, щоб результат не просто відповідав очікуванням, а перевищував їх.',
        
        footerDev: 'Розробка',
        footerDevText: 'Сайти, Боти та Сервери<br>для вашого бізнесу',
        footerStats: 'Статистика',
        footerProjects: '50+ Проєктів',
        footerClients: '30+ Клієнтів',
        footerYears: '3+ Років Досвіду',
        footerContact: 'Контакти'
    }
};

let currentLang = 'en';

function updateContent(lang) {
    const t = translations[lang];
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.innerHTML = t[key];
        }
    });
}

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const lang = this.getAttribute('data-lang');
        
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        currentLang = lang;
        updateContent(lang);
    });
});