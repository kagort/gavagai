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
        await this.generateBiographiesList(); // Добавлен await
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
            
            this.people = data.people;
            console.log(`👥 Загружено людей: ${this.people.length}`);
            
            // Создаем Map для быстрого доступа к местам
            data.places.forEach(place => {
                this.places.set(place.id, place);
            });
            console.log(`📍 Загружено мест: ${data.places.length}`);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
        }
    }

    async generateBiographiesList() {
        const container = document.querySelector('.content');
        if (!container) {
            console.error('❌ Контейнер .content не найден!');
            return;
        }

        let html = '<div class="biographies-container">';
        
        for (const person of this.people) {
            console.log(`👤 Обрабатываю: ${person.full_name}`);
            const birthPlace = this.places.get(person.birth.place_id);
            const deathPlace = person.death ? this.places.get(person.death.place_id) : null;
            
            let biographyContent = person.biography_text;
            if (person.biography_text.includes('.md')) {
                console.log(`📄 Загружаем MD файл: ${person.biography_text}`);
                biographyContent = await this.loadNotes(person.biography_text);
            }
            
            html += `
                <details class="material-item">
                    <summary class="material-summary">
                        <h2 class="person-name">${person.full_name}</h2>
                        <span class="person-dates">${this.formatDates(person)}</span>

                    </summary>'
                    <div class="material-content">
                        <div class="biography-text">
                            ${biographyContent}
                        </div>
                        
                        ${person.occupations && person.occupations.length > 0 ? `
                            <div class="occupations">
                                ${person.occupations.map(occupation => 
                                    `<span class="occupation-tag">${this.formatOccupation(occupation)}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                        
                        <div class="places-info">
                            <div class="place-card">
                                <h4>📍 Место рождения</h4>
                                ${birthPlace ? `
                                    <a href="place.html?id=${birthPlace.id}" class="place-link">
                                        ${birthPlace.name}
                                    </a>
                                    <div class="place-description">${birthPlace.description}</div>
                                ` : '<span>Не указано</span>'}
                            </div>
                            
                            ${deathPlace ? `
                                <div class="place-card">
                                    <h4>⚰️ Место смерти</h4>
                                    <a href="place.html?id=${deathPlace.id}" class="place-link">
                                        ${deathPlace.name}
                                    </a>
                                    <div class="place-description">${deathPlace.description}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </details>
            `;
        }
        
        html += '</div>';
        container.innerHTML = html;
        
        // УДАЛИ эту строку, т.к. теперь обычные ссылки
        // this.setupPlaceLinks();
    }
    
    async loadNotes(notesPath) {
        if (!notesPath) return '';
        
        try {
            const response = await fetch(notesPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const markdown = await response.text();
            return this.markdownToHtml(markdown);
        } catch (error) {
            console.error('Ошибка загрузки MD файла:', error);
            return `<p>Не удалось загрузить биографию: ${notesPath}</p>`;
        }
    }

    markdownToHtml(markdown) {
        if (!markdown) return '';
        
        // Улучшенный преобразователь Markdown в HTML
        let html = markdown
            // Заголовки
            .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Жирный и курсив
            .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            // Код
            .replace(/`(.*?)`/gim, '<code>$1</code>')
            // Ссылки - УБЕРИ target="_blank" для внутренних ссылок
            .replace(/\[([^\[]+)\]\(([^\)]+)\)/gim, '<a href="$2" class="markdown-link">$1</a>')
            // Блочные цитаты
            .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
            // Горизонтальные линии
            .replace(/^\-\-\-$/gim, '<hr>');

        // Обрабатываем списки
        html = this.processLists(html);
        
        // Обрабатываем параграфы
        html = this.processParagraphs(html);
        
        return html;
    }

    processLists(html) {
        // Обрабатываем ненумерованные списки
        let inUl = false;
        let ulHtml = '';
        const lines = html.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().startsWith('- ')) {
                if (!inUl) {
                    ulHtml += '<ul>';
                    inUl = true;
                }
                ulHtml += `<li>${line.replace('- ', '').trim()}</li>`;
            } else {
                if (inUl) {
                    ulHtml += '</ul>';
                    inUl = false;
                }
                ulHtml += line + '\n';
            }
        }
        
        if (inUl) {
            ulHtml += '</ul>';
        }
        
        return ulHtml;
    }

    processParagraphs(html) {
        const lines = html.split('\n');
        let result = '';
        let inParagraph = false;
        
        for (let line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine === '') {
                if (inParagraph) {
                    result += '</p>\n';
                    inParagraph = false;
                }
                continue;
            }
            
            // Если строка уже HTML тег (заголовок, список и т.д.), не оборачиваем в параграф
            if (trimmedLine.startsWith('<') && 
                (trimmedLine.startsWith('<h') || 
                trimmedLine.startsWith('<ul') || 
                trimmedLine.startsWith('<ol') || 
                trimmedLine.startsWith('<li') || 
                trimmedLine.startsWith('<blockquote') || 
                trimmedLine.startsWith('<hr') || 
                trimmedLine.startsWith('<a'))) {
                if (inParagraph) {
                    result += '</p>\n';
                    inParagraph = false;
                }
                result += line + '\n';
            } else {
                if (!inParagraph) {
                    result += '<p>';
                    inParagraph = true;
                } else {
                    result += '<br>';
                }
                result += trimmedLine;
            }
        }
        
        if (inParagraph) {
            result += '</p>';
        }
        
        return result;
    }

    formatDates(person) {
        // Если дата уже содержит дефис или сложный формат, возвращаем как есть
        if (person.birth.date && (person.birth.date.includes(' - ') || person.birth.date.includes('до н.э'))) {
            if (person.death && person.death.date) {
                return `${person.birth.date} — ${person.death.date}`;
            }
            return person.birth.date;
        }
        
        // Иначе используем обычное форматирование
        const birthDate = this.formatDate(person.birth.date);
        if (person.death && person.death.date) {
            const deathDate = this.formatDate(person.death.date);
            return `${birthDate} — ${deathDate}`;
        }
        return `род. ${birthDate}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    formatOccupation(occupation) {
        const occupationsMap = {
            'writer': 'Писатель',
            'philosopher': 'Философ',
            'cosmonaut': 'Космонавт',
            'pilot': 'Лётчик',
            'scientist': 'Учёный',
            'artist': 'Художник',
            'composer': 'Композитор',
            'inventor': 'Изобретатель'
        };
        
        return occupationsMap[occupation] || occupation;
    }

    setupPlaceLinks() {
        const placeLinks = document.querySelectorAll('.place-link');
        console.log(`🔗 Найдено ссылок на места: ${placeLinks.length}`);
        placeLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const placeId = e.target.getAttribute('data-place-id');
                this.showPlaceInfo(placeId);
            });
        });
    }

    showPlaceInfo(placeId) {
        const place = this.places.get(placeId);
        if (place) {
            alert(`📍 ${place.name}\n\n${place.description}\n\nКоординаты: ${place.coordinates.lat}, ${place.coordinates.lon}`);
        }
    }
}

// Инициализация
console.log('🔄 DOM загружен, запускаю приложение...');
document.addEventListener('DOMContentLoaded', () => {
    new BiographiesViewer();
});