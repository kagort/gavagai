class SeminarsGenerator {
    constructor() {
        this.seminars = [];
        this.init();
    }

    async init() {
        await this.loadSeminars();
        this.generateSeminarsList();
    }

    async loadSeminars() {
        try {
            const response = await fetch('data/index.json');
            const data = await response.json();
            this.seminars = data.meetings || [];
        } catch (error) {
            console.error('Ошибка загрузки семинаров:', error);
        }
    }

    generateSeminarsList() {
        const container = document.querySelector('.content') || 
                        document.getElementById('seminars-container') || 
                        document.getElementById('meetings-table')?.parentElement;
        
        if (!container) {
            console.error('Контейнер для семинаров не найден');
            return;
        }

        container.innerHTML = '';
        
        this.seminars.forEach((seminar, index) => {
            const seminarCard = this.createSeminarCard(seminar, index);
            container.appendChild(seminarCard);
        });

        // Открыть первый семинар по умолчанию
        this.openFirstSeminar(container);
    }

    createSeminarCard(seminar, index) {
        const seminarCard = document.createElement('div');
        seminarCard.className = 'seminar-card';
        
        const seminarHeader = this.createSeminarHeader(seminar);
        const seminarContent = this.createSeminarContent(seminar);
        
        this.setupClickHandler(seminarHeader, seminarContent);
        
        seminarCard.appendChild(seminarHeader);
        seminarCard.appendChild(seminarContent);
        
        return seminarCard;
    }

    createSeminarHeader(seminar) {
        const seminarHeader = document.createElement('div');
        seminarHeader.className = 'seminar-header';
        seminarHeader.innerHTML = `
            <div>
                <h2>
                    <span class="seminar-number">${seminar.number ? `Семинар ${seminar.number}` : ''}</span>
                    ${seminar.topic || ''}
                </h2>
            </div>
            <div class="seminar-date">${seminar.date || ''}</div>
            <div class="chevron"><i class="fas fa-chevron-down"></i></div>
        `;
        return seminarHeader;
    }

    createSeminarContent(seminar) {
        const seminarContent = document.createElement('div');
        seminarContent.className = 'seminar-content';
        
        // Генерация контента на основе данных из таблицы
        const contentHTML = this.generateContentHTML(seminar);
        seminarContent.innerHTML = contentHTML;
        
        return seminarContent;
    }

    generateContentHTML(seminar) {
        let html = '';
        
        // Цель и материалы (берем из seminar.materials)
        if (seminar.materials) {
            html += `
                <div class="section">
                    <h3 class="section-title"><i class="fas fa-bullseye"></i> Цель и материалы</h3>
                    <p>${this.formatTextWithLineBreaks(seminar.materials)}</p>
                </div>
            `;
        }
        
        // Основная литература
        if (seminar.literature && seminar.literature.length > 0) {
            const literatureHTML = seminar.literature.map(item => 
                `<li><i class="fas fa-book"></i> <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a></li>`
            ).join('');
            
            html += `
                <div class="section">
                    <h3 class="section-title"><i class="fas fa-book-open"></i> Основная литература</h3>
                    <ul class="materials-list">
                        ${literatureHTML}
                    </ul>
                </div>
            `;
        }
        
        // Дополнительные материалы
        if (seminar.additionalMaterials && seminar.additionalMaterials.length > 0) {
            const additionalMaterialsHTML = seminar.additionalMaterials.map(item => 
                `<li><i class="fas fa-file-alt"></i> <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a></li>`
            ).join('');
            
            html += `
                <div class="section">
                    <h3 class="section-title"><i class="fas fa-plus-circle"></i> Дополнительные материалы</h3>
                    <ul class="materials-list">
                        ${additionalMaterialsHTML}
                    </ul>
                </div>
            `;
        }
        
        // План занятия
        if (seminar.plan) {
            // Проверяем, является ли план строкой или массивом
            let planHTML = '';
            if (Array.isArray(seminar.plan)) {
                planHTML = seminar.plan.map(item => `<li>${item}</li>`).join('');
            } else {
                // Если это строка, разбиваем по переносам строк
                const planItems = seminar.plan.split('\n').filter(item => item.trim());
                planHTML = planItems.map(item => `<li>${item.trim()}</li>`).join('');
            }
            
            html += `
                <div class="section">
                    <h3 class="section-title"><i class="fas fa-list-ol"></i> План занятия</h3>
                    <ol class="plan-list">
                        ${planHTML}
                    </ol>
                </div>
            `;
        }
        
        // Если данных совсем нет
        if (!html) {
            html = '<p>Информация о семинаре отсутствует</p>';
        }
        
        return html;
    }

    setupClickHandler(header, content) {
        header.addEventListener('click', function() {
            content.classList.toggle('active');
            const chevron = this.querySelector('.chevron i');
            if (chevron) {
                chevron.classList.toggle('rotated');
            }
        });
    }

    openFirstSeminar(container) {
        const firstSeminarContent = container.querySelector('.seminar-content');
        const firstChevron = container.querySelector('.chevron i');
        
        if (firstSeminarContent && firstChevron) {
            firstSeminarContent.classList.add('active');
            firstChevron.classList.add('rotated');
        }
    }

    formatTextWithLineBreaks(text) {
        if (!text) return '';
        return text.replace(/\n/g, '<br>');
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new SeminarsGenerator();
});