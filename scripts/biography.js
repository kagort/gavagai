class BiographiesViewer {
    constructor() {
        this.people = [];
        this.places = new Map();
        console.log('✅ Класс BiographiesViewer создан');
        this.init();
    }

    async init() {
        console.log('🚀 Начало инициализации');
        await this.loadData();
        await this.generatePeopleGrid();
        console.log('✅ Инициализация завершена');
    }

    async loadData() {
        try {
            console.log('📥 Пытаюсь загрузить данные...');
            const response = await fetch('data/biography.json');
            console.log('📊 Ответ от сервера:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Данные загружены:', data);
            
            // Фильтруем только людей с заполненными именами
            this.people = data.people.filter(person => person.full_name && person.full_name.trim() !== '');
            console.log(`👥 Загружено людей: ${this.people.length}`);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
        }
    }

    async generatePeopleGrid() {
        const container = document.querySelector('.materials-container');
        if (!container) {
            console.error('❌ Контейнер .materials-container не найден!');
            return;
        }

        let html = '<div class="people-grid">';
        
        for (const person of this.people) {
            console.log(`👤 Обрабатываю: ${person.full_name}`);
            
            html += `
                <div class="person-card">
                    <a href="person.html?id=${person.id}" class="person-image-link">
                        <div class="person-image-container">
                            ${person.img ? `
                                <img src="${person.img}" alt="${person.full_name}" class="person-image">
                            ` : `
                                <div class="person-image-placeholder">📷</div>
                            `}
                        </div>
                    </a>
                    <div class="person-info">
                        <h3 class="person-name">${person.full_name}</h3>
                        <p class="person-dates">${this.formatDates(person)}</p>
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
    }

    formatDates(person) {
        if (person.birth.date && (person.birth.date.includes(' - ') || person.birth.date.includes('до н.э'))) {
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
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

// Инициализация
console.log('🔄 DOM загружен, запускаю приложение...');
document.addEventListener('DOMContentLoaded', () => {
    new BiographiesViewer();
});