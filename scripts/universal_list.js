class UniversalLoader {
    constructor() {
        // Базовые настройки для каждой страницы
        this.configs = {
            'meetings.html': {
                json: 'data/meetings.json',
                container: '.materials-container',
                dataKey: 'materials', // Ключ для массива данных
                template: 'meeting' // Используем шаблон встреч
            },
            'biography.html': {
                json: 'data/biography.json',
                container: '.materials-container',
                dataKey: 'people',
                template: 'person' // Используем шаблон "person"
            }
        };
        
        // Шаблоны HTML (ваш оригинальный дизайн)
        this.templates = {
            person: (item) => `
                <div class="card">
                    <a href="common.html?type=person&id=${item.id}" class="image-link">
                        <div class="image-container">
                            ${item.img ? `
                                <img src="${item.img}" alt="${item.full_name}" class="image">
                            ` : `
                                <div class="image-placeholder">📷</div>
                            `}
                        </div>
                    </a>
                    <div class="info">
                        <h3 class="name">${item.full_name}</h3>
                        <p class="dates">${this.formatPersonDates(item)}</p>
                    </div>
                </div>
            `,
            
            meeting: (item) => `
                <div class="card">
                    <a href="common.html?type=meeting&id=${item.id}" class="image-link">
                        <div class="image-container">
                            ${item.image ? `
                                <img src="${item.image}" alt="${item.title}" class="image">
                            ` : `
                                <div class="image-placeholder">📅</div>
                            `}
                        </div>
                    </a>
                    <div class="info">
                        <h3 class="name">${item.title}</h3>
                        <p class="dates">${this.formatDate(item.date)}</p>
                    </div>
                </div>
            `
        };
        
        this.start();
    }

    async start() {
        const page = this.getPageName();
        const config = this.configs[page];
        
        if (!config) return;
        
        const data = await this.loadData(config.json);
        if (!data) return;
        
        // Получаем нужный массив
        const items = config.dataKey ? data[config.dataKey] || [] : data;
        
        // Рендерим с выбранным шаблоном
        this.renderWithTemplate(items, config);
    }

    renderWithTemplate(items, config) {
        const container = document.querySelector(config.container);
        const template = this.templates[config.template];
        
        if (!container || !template) return;
        
        let html = '<div class="grid">';
        
        // ВАШ ЦИКЛ, но универсальный!
        for (const item of items) {
            console.log(`👤 Обрабатываю: ${item.full_name || item.title}`);
            html += template(item);
        }
        
        html += '</div>';
        container.innerHTML = html;
    }

    // Ваши функции форматирования
    formatPersonDates(person) {
        if (!person.birth || !person.birth.date) return '';
        
        if (person.birth.date.includes(' - ') || person.birth.date.includes('до н.э')) {
            if (person.death && person.death.date) {
                return `${person.birth.date} — ${person.death.date}`;
            }
            return person.birth.date;
        }
        
        const birthDate = this.formatDate(person.birth.date);
        if (person.death && person.death.date) {
            const deathDate = this.formatDate(person.death.date);
            return `${birthDate} — ${deathDate}`;
        }
        return `род. ${birthDate}`;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    getPageName() {
        return window.location.pathname.split('/').pop() || 'index.html';
    }

    async loadData(url) {
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            return null;
        }
    }
}

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    new UniversalLoader();
});