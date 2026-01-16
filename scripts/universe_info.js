class ItemDetail {
    constructor() {
        console.log('🚀 ItemDetail запущен');
        this.itemId = null;
        this.item = null;
        this.allData = null;
        this.dataType = null;
        this.mdContent = '';
        this.sections = [];
        this.currentSectionId = null;
        this.modalCache = {};
        this.init();
    }

    async init() {
        console.log('📍 URL:', window.location.href);
        
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
            let jsonFile = 'data/biography.json';
            
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
            console.log('✅ Данные загружены');
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            this.showError('Ошибка загрузки данных');
        }
    }

    async displayItem() {
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
        
        this.item = items.find(item => item.id == this.itemId);
        
        const container = document.getElementById('item-detail');
        
        if (!container) {
            console.error('❌ Контейнер #item-detail не найден!');
            return;
        }
        
        if (!this.item) {
            container.innerHTML = '<p>Элемент не найден</p>';
            return;
        }

        // Загружаем MD контент если есть
        let mdContent = '';
        if (this.item.biography_text && this.item.biography_text.includes('.md')) {
            console.log('📄 Загружаю биографию:', this.item.biography_text);
            mdContent = await this.loadMDContent(this.item.biography_text);
        } else if (this.item.notes && this.item.notes.includes('.md')) {
            console.log('📄 Загружаю конспект:', this.item.notes);
            mdContent = await this.loadMDContent(this.item.notes);
        }

        this.mdContent = mdContent;
        this.parseSections(mdContent);
        this.createLayoutWithTOC();
        
        document.title = this.getItemTitle();
    }

    async loadMDContent(path) {
        try {
            const response = await fetch(path);
            
            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status}`);
            }
            
            return await response.text();
            
        } catch (error) {
            return '# Ошибка загрузки\n\nНе удалось загрузить контент.';
        }
    }

    parseSections(mdContent) {
        this.sections = [];
        
        if (!mdContent) return;
        
        const lines = mdContent.split('\n');
        let currentSection = null;
        let sectionContent = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            const h1Match = line.match(/^# (.*)/);
            
            if (h1Match) {
                if (currentSection) {
                    currentSection.content = sectionContent.join('\n');
                    this.sections.push(currentSection);
                    sectionContent = [];
                }
                
                const title = h1Match[1];
                const id = this.createId(title);
                
                currentSection = {
                    id: id,
                    title: title,
                    originalTitle: line,
                    startIndex: i
                };
                
                sectionContent.push(line);
                
            } else if (currentSection) {
                sectionContent.push(line);
            } else {
                if (!currentSection) {
                    const id = 'intro';
                    currentSection = {
                        id: id,
                        title: 'Введение',
                        originalTitle: '',
                        startIndex: 0
                    };
                }
                sectionContent.push(line);
            }
        }
        
        if (currentSection) {
            currentSection.content = sectionContent.join('\n');
            this.sections.push(currentSection);
        }
        
        if (this.sections.length === 0 && mdContent.trim()) {
            this.sections.push({
                id: 'main',
                title: 'Содержание',
                originalTitle: '# Содержание',
                content: mdContent,
                startIndex: 0
            });
        }

    }

    createId(title) {
        return title.toLowerCase()
            .replace(/[^\w\sа-яё-]/gi, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    createLayoutWithTOC() {
        const container = document.getElementById('item-detail');
        
        container.innerHTML = `
            <div class="item-detail-layout">
                <aside class="item-toc">
                    <div class="toc-header">
                        <h3>Оглавление</h3>
                        <button class="toc-toggle" id="toc-toggle">☰</button>
                    </div>
                    <nav class="toc-nav">
                        <ul class="toc-list" id="toc-list"></ul>
                    </nav>
                </aside>
                
                <main class="item-content-container">
                    <div class="item-content-header">
                        <h1>${this.getItemMainTitle()}</h1>
                        ${this.getItemSubtitle()}
                        ${this.renderAudioPlayer()}
                    </div>
                    <div class="current-section" id="current-section">
                        ${this.sections.length > 0 ? 
                            this.renderSectionContent(this.sections[0]) : 
                            '<p>Контент отсутствует</p>'
                        }
                    </div>
                </main>
            </div>
            
            <!-- Модальное окно -->
            <div id="modal-overlay" class="modal-overlay" style="display: none;">
                <div class="modal-container">
                    <div class="modal-header">
                        <h3 class="modal-title"></h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-content"></div>
                    <div class="modal-footer">
                        <button class="modal-close-btn">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        
        this.populateTOC();
        
        if (this.sections.length > 0) {
            this.currentSectionId = this.sections[0].id;
            this.setActiveTocLink(this.sections[0].id);
        }
        
        this.setupEventListeners();
        this.setupModal();
    }

    getItemMainTitle() {
        if (this.dataType === 'person') {
            return this.item.full_name || 'Биография';
        } else if (this.dataType === 'meeting') {
            return this.item.title || 'Встреча';
        } else {
            return this.item.full_name || this.item.title || this.item.name || 'Детали';
        }
    }

    getItemSubtitle() {
        if (this.dataType === 'person') {
            return this.item.birth?.date ? `<p class="item-subtitle">${this.formatDates()}</p>` : '';
        } else if (this.dataType === 'meeting') {
            return this.item.date ? `<p class="item-subtitle">${this.formatMeetingDate()}</p>` : '';
        }
        return '';
    }

    renderAudioPlayer() {
        if (this.dataType === 'meeting' && this.item.audio) {
            return `
                <div class="audio-player">
                    <h3>Аудиозапись</h3>
                    <audio controls>
                        <source src="${this.item.audio}" type="audio/mpeg">
                        Ваш браузер не поддерживает аудио.
                    </audio>
                </div>
            `;
        }
        return '';
    }

    populateTOC() {
        const tocList = document.getElementById('toc-list');
        if (!tocList) return;
        
        let html = '';
        
        this.sections.forEach((section) => {
            html += `
                <li class="toc-item">
                    <a href="#" class="toc-link" data-section-id="${section.id}">
                        ${section.title}
                    </a>
                </li>
            `;
        });
        
        tocList.innerHTML = html;
    }

    renderSectionContent(section) {
        if (!section || !section.content) return '<p>Контент отсутствует</p>';
        
        // ВАЖНО: Преобразуем MD в HTML с ОСОБОЙ обработкой ссылок
        return this.markdownToHtmlWithModalLinks(section.content);
    }

    markdownToHtmlWithModalLinks(markdown) {
        if (!markdown) return '';
        
        let html = markdown
            // ВАЖНО: Обрабатываем ВСЕ ссылки как потенциально модальные
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                // Проверяем, это .md файл?
                if (url.toLowerCase().endsWith('.md')) {
                    // Это .md файл - делаем модальную ссылку
                    return `<a href="#" class="md-modal-link" data-md-url="${url}">${text}</a>`;
                }
                // Это внешняя ссылка - оставляем как есть
                return `<a href="${url}" target="_blank" rel="noopener" class="external-link">${text}</a>`;
            })
            // Остальная обработка Markdown
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
            .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
            .replace(/^\-\-\-$/gim, '<hr>');

        html = this.processLists(html);
        html = this.processParagraphs(html);
        
        return html;
    }

    setupModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalClose = document.querySelector('.modal-close');
        const modalCloseBtn = document.querySelector('.modal-close-btn');
        
        // Закрытие по кнопкам
        modalClose?.addEventListener('click', () => this.closeModal());
        modalCloseBtn?.addEventListener('click', () => this.closeModal());
        
        // Закрытие по клику на фон
        modalOverlay?.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeModal();
            }
        });
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.style.display !== 'none') {
                this.closeModal();
            }
        });
        
        // Обработка кликов по .md ссылкам
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('md-modal-link')) {
                e.preventDefault();
                const mdUrl = e.target.getAttribute('data-md-url');
                const linkText = e.target.textContent;
                await this.openMdModal(mdUrl, linkText);
            }
        });
    }

    async openMdModal(mdUrl, title = 'Дополнительная информация') {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalTitle = document.querySelector('.modal-title');
        const modalContent = document.querySelector('.modal-content');
        
        // Показываем загрузку
        modalOverlay.style.display = 'flex';
        modalTitle.textContent = 'Загрузка...';
        modalContent.innerHTML = `
            <div class="modal-loading">
                <div class="spinner"></div>
                <p>Загрузка информации...</p>
            </div>
        `;
        
        try {
            // Загружаем .md файл
            const response = await fetch(mdUrl);
            
            if (!response.ok) {
                throw new Error(`Файл не найден: ${mdUrl}`);
            }
            
            const mdContent = await response.text();
            
            // Преобразуем MD в HTML
            const htmlContent = this.markdownToHtmlWithModalLinks(mdContent);
            
            // Показываем контент
            modalTitle.textContent = title;
            modalContent.innerHTML = htmlContent;
            
        } catch (error) {
            modalTitle.textContent = 'Ошибка';
            modalContent.innerHTML = `
                <div class="modal-error">
                    <div class="error-icon">⚠️</div>
                    <h4>Не удалось загрузить</h4>
                    <p>Файл: <code>${mdUrl}</code></p>
                    <p><small>${error.message}</small></p>
                </div>
            `;
        }
    }

    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    }

    setActiveTocLink(sectionId) {
        const tocLinks = document.querySelectorAll('.toc-link');
        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section-id') === sectionId) {
                link.classList.add('active');
            }
        });
    }

    setupEventListeners() {
        // Обработчики для ссылок в оглавлении
        const tocLinks = document.querySelectorAll('.toc-link');
        tocLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section-id');
                
                this.loadAndDisplaySection(sectionId);
                this.setActiveTocLink(sectionId);
            });
        });
        
        // Кнопка переключения оглавления на мобильных
        const toggleBtn = document.getElementById('toc-toggle');
        const tocSidebar = document.querySelector('.item-toc');
        
        if (toggleBtn && tocSidebar) {
            toggleBtn.addEventListener('click', () => {
                tocSidebar.classList.toggle('collapsed');
                toggleBtn.textContent = tocSidebar.classList.contains('collapsed') ? '☰' : '✕';
            });
            
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && 
                    !tocSidebar.contains(e.target) && 
                    e.target !== toggleBtn) {
                    tocSidebar.classList.add('collapsed');
                    toggleBtn.textContent = '☰';
                }
            });
        }
    }

    loadAndDisplaySection(sectionId) {
        const section = this.sections.find(s => s.id === sectionId);
        if (!section) return;
        
        this.currentSectionId = sectionId;
        
        const contentContainer = document.getElementById('current-section');
        if (contentContainer) {
            contentContainer.innerHTML = this.renderSectionContent(section);
            contentContainer.scrollTop = 0;
        }
    }

    // Вспомогательные методы
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

    formatMeetingDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
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

    showError(message) {
        const container = document.getElementById('item-detail');
        if (container) {
            container.innerHTML = `<div class="error"><p>${message}</p></div>`;
        } else {
            document.body.innerHTML = `<div style="padding: 20px; color: red;"><p>${message}</p></div>`;
        }
    }
}

// Запускаем
document.addEventListener('DOMContentLoaded', () => {
    new ItemDetail();
});