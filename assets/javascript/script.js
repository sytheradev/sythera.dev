if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

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
        botsDesc: 'Convenient bots for automation, sales, customer support, and business processes. Integration with websites and payment systems - including cryptocurrency.',        
        
        appsTitle: 'Servers',
        appsDesc: 'Professional setup and administration of servers for bots and websites. VPS/Dedicated configuration, security, auto-backups, and 24/7 monitoring.',

        aboutText: 'We are a team of developers that creates effective digital solutions for business. Our expertise covers web development, Telegram bots, and server infrastructure. We prioritize code quality, security, and performance in every project, delivering reliable, fast, and scalable solutions for our clients. With years of experience in modern technologies, we constantly seek new approaches, optimize processes, and implement innovations so the result not only meets expectations but exceeds them.',

        footerDev: 'Development',
        footerDevText: 'Websites, Bots & Servers<br>for your business',
        footerStats: 'Statistics',
        footerProjects: '55+ Projects',
        footerClients: '40+ Clients',
        footerYears: '4+ Years Experience',
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
        botsDesc: 'Зручні боти для автоматизації, продажу, підтримки клієнтів та бізнес-процесів. Інтеграція з сайтами, платіжними системами - включаючи криптовалюту.',
        
        appsTitle: 'Сервери',
        appsDesc: 'Професійне налаштування та адміністрування серверів для ботів і сайтів. Конфігурація VPS/Dedicated, безпека, автобекапи та моніторинг 24/7.',
        
        aboutText: 'Ми - команда розробників, що створює ефективні цифрові рішення для бізнесу. Наша експертиза охоплює веб-розробку, Telegram-боти та серверну інфраструктуру. Ми надаємо пріоритет якості коду, безпеці та продуктивності в кожному проєкті, забезпечуючи надійні, швидкі та масштабовані рішення для наших клієнтів. З багаторічним досвідом у сучасних технологіях ми завжди шукаємо нові підходи, оптимізуємо процеси та впроваджуємо інновації, щоб результат не просто відповідав очікуванням, а перевищував їх.',
        
        footerDev: 'Розробка',
        footerDevText: 'Сайти, Боти та Сервери<br>для вашого бізнесу',
        footerStats: 'Статистика',
        footerProjects: '55+ Проєктів',
        footerClients: '40+ Клієнтів',
        footerYears: '4+ Років Досвіду',
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
        localStorage.setItem('language', lang);
        updateContent(lang);
    });
});

const savedLang = localStorage.getItem('language') || 'en';
if (savedLang !== currentLang) {
    currentLang = savedLang;
    updateContent(savedLang);
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.getAttribute('data-lang') === savedLang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}