class PersonDetail {
    constructor() {
        this.personId = null;
        this.person = null;
        this.allData = null;
        this.init();
    }

    async init() {
        this.personId = this.getPersonIdFromUrl();
        console.log('👤 ID человека:', this.personId);
        
        await this.loadData();
        this.displayPerson();
    }

    getPersonIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadData() {
        try {
            const response = await fetch('data/biography.json');
            this.allData = await response.json();
            console.log('📦 Все данные загружены');
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
        }
    }

    async displayPerson() {
        this.person = this.allData.people.find(person => person.id == this.personId);
        
        if (!this.person) {
            document.getElementById('person-detail').innerHTML = '<p>Человек не найден</p>';
            return;
        }

        // Загружаем биографию из MD файла
        let biographyContent = '';
        if (this.person.biography_text && this.person.biography_text.includes('.md')) {
            biographyContent = await this.loadBiography(this.person.biography_text);
        }

        const container = document.getElementById('person-detail');
        container.innerHTML = `
            <div class="person-detail-header">
                <div class="person-detail-info">
                    <h1>${this.person.full_name}</h1>
                </div>
            </div>
            
            <div class="person-biography">
                ${biographyContent || '<p>Биография отсутствует</p>'}
            </div>
        `;

        document.title = `${this.person.full_name} - Биография`;
    }

    async loadBiography(notesPath) {
        try {
            const response = await fetch(notesPath);
            const markdown = await response.text();
            return this.markdownToHtml(markdown);
        } catch (error) {
            console.error('Ошибка загрузки биографии:', error);
            return '<p>Не удалось загрузить биографию</p>';
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

document.addEventListener('DOMContentLoaded', () => {
    new PersonDetail();
});