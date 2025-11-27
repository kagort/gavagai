class MaterialsGenerator {
    constructor() {
        this.materials = [];
        this.init();
    }

    async init() {
        await this.loadMaterials();
        this.generateMaterialsList();
    }

    async loadMaterials() {
        try {
            const response = await fetch('data/materials.json');
            const data = await response.json();
            this.materials = data.materials;
        } catch (error) {
            console.error('Ошибка загрузки материалов:', error);
        }
    }

    async generateMaterialsList() {
    const container = document.querySelector('.content');
    if (!container) return;

    let html = '<div class="materials-container">';
    
    for (const material of this.materials) {
        const notesContent = await this.loadNotes(material.notes);
        
        html += `
            <details class="material-item">
                <summary class="material-summary">
                    <h2 class="material-title">${material.title}</h2>
                    <span class="material-date">${this.formatDate(material.date)}</span>
                </summary>
                <div class="material-content">
                    ${material.audio ? `
                        <div class="audio-player">
                            <audio controls>
                                <source src="${material.audio}" type="audio/mpeg">
                                Ваш браузер не поддерживает аудио.
                            </audio>
                        </div>
                    ` : ''}
                    
                    <div class="notes-content">
                        ${notesContent}
                    </div>
                </div>
            </details>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

    async loadNotes(notesPath) {
        if (!notesPath) return '';
        
        try {
            const response = await fetch(notesPath);
            const markdown = await response.text();
            return this.markdownToHtml(markdown);
        } catch (error) {
            console.error('Ошибка загрузки заметок:', error);
            return '<p>Заметки не найдены</p>';
        }
    }

    markdownToHtml(markdown) {
        // Простой преобразователь Markdown в HTML
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^\s*-\s(.*$)/gim, '<ul><li>$1</li></ul>')
            .replace(/^\s*\d\.\s(.*$)/gim, '<ol><li>$1</li></ol>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new MaterialsGenerator();
});