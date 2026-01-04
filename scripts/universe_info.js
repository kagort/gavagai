class ItemDetail {
    constructor() {
        console.log('🚀 ItemDetail запущен');
        this.itemId = null;
        this.item = null;
        this.allData = null;
        this.dataType = null;
        this.init();
    }

    async init() {
        console.log('📍 URL:', window.location.href);
        
        // Получаем параметры из URL
        const urlParams = new URLSearchParams(window.location.search);
        this.dataType = urlParams.get('type') || 'person';
        this.itemId = urlParams.get('id');
        
        console.log('📋 Параметры:', { type: this.dataType, id: this.itemId });
        
        if (!this.itemId) {
            console.error('❌ Не указан ID элемента');
            this.showError('Не указан ID элемента');
            return;
        }
        
        await this.loadData();
        await this.displayItem();
    }

    async loadData() {
        try {
            // Выбираем JSON файл в зависимости от типа
            let jsonFile = 'data/biography.json'; // По умолчанию
            
            if (this.dataType === 'meeting') {
                jsonFile = 'data/meetings.json';
            } else if (this.dataType === 'book') {
                jsonFile = 'data/books.json';
            } else if (this.dataType === 'place') {
                jsonFile = 'data/places.json';
            }
            
            console.log(`📦 Загружаю файл: ${jsonFile}`);
            const response = await fetch(jsonFile);
            
            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status}`);
            }
            
            this.allData = await response.json();
            console.log('✅ Данные загружены:', this.allData);
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            this.showError('Ошибка загрузки данных');
        }
    }

    async displayItem() {
        console.log('🎨 Начинаю отображение...');
        
        // Выбираем правильный массив данных
        let items = [];
        
        if (this.dataType === 'person') {
            items = this.allData?.people || [];
        } else if (this.dataType === 'meeting') {
            items = this.allData?.materials || [];
        } else if (this.dataType === 'book') {
            items = this.allData?.books || [];
        } else if (this.dataType === 'place') {
            items = this.allData?.places || [];
        }
        
        console.log(`📊 Найден массив: ${items.length} элементов`);
        console.log('🔍 Ищу элемент с ID:', this.itemId);
        
        this.item = items.find(item => item.id == this.itemId);
        console.log('🎯 Найденный элемент:', this.item);
        
        const container = document.getElementById('item-detail');
        console.log('📦 Контейнер:', container);
        
        if (!container) {
            console.error('❌ Контейнер #item-detail не найден на странице!');
            console.log('🔍 Проверьте HTML: есть ли <div id="item-detail">...</div>?');
            return;
        }
        
        if (!this.item) {
            container.innerHTML = '<p>Элемент не найден</p>';
            console.warn('⚠️ Элемент не найден в массиве');
            return;
        }

        // Загружаем дополнительный контент если есть
        let extraContent = '';
        if (this.item.biography_text && this.item.biography_text.includes('.md')) {
            console.log('📄 Загружаю биографию:', this.item.biography_text);
            extraContent = await this.loadExtraContent(this.item.biography_text);
        } else if (this.item.notes && this.item.notes.includes('.md')) {
            console.log('📄 Загружаю конспект:', this.item.notes);
            extraContent = await this.loadExtraContent(this.item.notes);
        }

        // Генерируем HTML в зависимости от типа данных
        let html = '';
        if (this.dataType === 'person') {
            html = this.renderPerson(extraContent);
        } else if (this.dataType === 'meeting') {
            html = this.renderMeeting(extraContent);
        } else {
            html = this.renderGenericItem(extraContent);
        }
        
        console.log('✏️ HTML сгенерирован, вставляю в контейнер...');
        container.innerHTML = html;

        // Обновляем заголовок страницы
        document.title = this.getItemTitle();
        console.log('✅ Отображение завершено');
    }

    // Для биографий
    renderPerson(extraContent) {
        return `
            <div class="detail-header">
                <div class="detail-info">
                    <h1>${this.item.full_name || 'Без имени'}</h1>
                    ${this.item.birth?.date ? `<p class="date">${this.formatDates()}</p>` : ''}
                </div>
            </div>
            
            <div class="biography">
                ${extraContent || this.item.description || this.item.bio?.short || '<p>Биография отсутствует</p>'}
            </div>
        `;
    }

    // Для встреч
    renderMeeting(extraContent) {
        return `
            <div class="detail-header">
                <div class="detail-info">
                    <h1>${this.item.title || 'Без названия'}</h1>
                    ${this.item.date ? `<p class="date">${this.formatMeetingDate()}</p>` : ''}
                    
                    <div class="links">
                        ${this.item.audio ? `
                        <div class="audio-player">
                            <audio controls>
                                <source src="${this.item.audio}" type="audio/mpeg">
                                Ваш браузер не поддерживает аудио.
                            </audio>
                        </div>
                    ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="content">
                ${extraContent || this.item.description || '<p>Контент отсутствует</p>'}
            </div>
        `;
    }

    // Для остальных типов
    renderGenericItem(extraContent) {
        const title = this.item.full_name || this.item.title || this.item.name || 'Без названия';
        
        return `
            <div class="item-detail-header">
                <div class="item-detail-info">
                    <h1>${title}</h1>
                    ${this.item.description ? `<p class="item-description">${this.item.description}</p>` : ''}
                </div>
            </div>
            
            <div class="item-content">
                ${extraContent || ''}
            </div>
        `;
    }

    getItemTitle() {
        if (this.dataType === 'person') {
            return `${this.item.full_name || 'Биография'} - Биография`;
        } else if (this.dataType === 'meeting') {
            return `${this.item.title || 'Встреча'} - Встреча`;
        } else {
            const title = this.item.full_name || this.item.title || this.item.name || 'Детали';
            return `${title} - Подробности`;
        }
    }

    formatDates() {
        const person = this.item;
        
        if (!person.birth || !person.birth.date) {
            return '';
        }
        
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

    formatMeetingDate() {
        if (!this.item.date) return '';
        
        try {
            const date = new Date(this.item.date);
            return date.toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return this.item.date;
        }
    }

    async loadExtraContent(notesPath) {
        try {
            console.log(`📄 Загружаю: ${notesPath}`);
            const response = await fetch(notesPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status}`);
            }
            
            const markdown = await response.text();
            const html = this.markdownToHtml(markdown);
            return html;
            
        } catch (error) {
            console.error('❌ Ошибка загрузки контента:', error);
            return '<p class="error">Не удалось загрузить дополнительный контент</p>';
        }
    }

    // Ваши функции markdown
    markdownToHtml(markdown) {
        if (!markdown) return '';
        
        let html = markdown
            .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/`(.*?)`/gim, '<code>$1</code>')
            .replace(/\[([^\[]+)\]\(([^\)]+)\)/gim, '<a href="$2" class="markdown-link">$1</a>')
            .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/^\-\-\-$/gim, '<hr>');

        html = this.processLists(html);
        html = this.processParagraphs(html);
        
        return html;
    }

    processLists(html) {
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

    showError(message) {
        const container = document.getElementById('item-detail');
        if (container) {
            container.innerHTML = `<div class="error"><p>${message}</p></div>`;
        } else {
            document.body.innerHTML = `<div style="padding: 20px; color: red;"><p>${message}</p></div>`;
        }
    }
}

// Запускаем с проверкой
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, запускаю ItemDetail...');
    
    // Проверяем наличие контейнера
    const container = document.getElementById('item-detail');
    if (!container) {
        console.error('❌ ОШИБКА: Элемент с id="item-detail" не найден на странице!');
        console.log('🔍 Ищу все элементы с id:');
        document.querySelectorAll('[id]').forEach(el => {
            console.log(`  - id="${el.id}"`);
        });
        
        // Создаем контейнер если его нет
        const newContainer = document.createElement('div');
        newContainer.id = 'item-detail';
        document.body.appendChild(newContainer);
        console.log('✅ Создан новый контейнер #item-detail');
    }
    
    new ItemDetail();
});