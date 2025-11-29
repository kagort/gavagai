class PlaceViewer {
    constructor() {
        this.placeId = null;
        this.place = null;
        this.allData = null;
        this.init();
    }

    async init() {
        this.placeId = this.getPlaceIdFromUrl();
        console.log('📍 ID места:', this.placeId);
        
        await this.loadData();
        this.displayPlaceInfo();
        this.displayRelatedPeople();
    }

    getPlaceIdFromUrl() {
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

    displayPlaceInfo() {
        this.place = this.allData.places.find(place => place.id === this.placeId);
        
        if (!this.place) {
            document.getElementById('place-name').textContent = 'Место не найдено';
            return;
        }

        document.getElementById('place-name').textContent = this.place.name;
        document.getElementById('place-type').textContent = this.formatPlaceType(this.place.type);
        
        // ЗАМЕНИТЕ ЭТУ СТРОКУ:
        // document.getElementById('place-description').textContent = this.place.description;
        // НА ЭТУ:
        this.displayMarkdownDescription();
        
        document.getElementById('place-coordinates').textContent = 
            `Широта: ${this.place.coordinates.lat}, Долгота: ${this.place.coordinates.lon}`;
        
        document.title = `${this.place.name} - Информация о месте`;
    }

    // ДОБАВЬТЕ ЭТОТ МЕТОД:
    displayMarkdownDescription() {
        const descriptionElement = document.getElementById('place-description');
        
        if (!this.place.description) {
            descriptionElement.innerHTML = '<p>Описание отсутствует</p>';
            return;
        }

        // Преобразуем Markdown ссылки в HTML
        const htmlContent = this.parseMarkdownLinks(this.place.description);
        descriptionElement.innerHTML = htmlContent;
    }

    // ДОБАВЬТЕ ЭТОТ МЕТОД:
    parseMarkdownLinks(text) {
        if (!text) return '';
        
        // Преобразуем только ссылки [текст](url) в HTML
        return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="markdown-link">$1</a>');
    }

    // ОСТАЛЬНОЙ ВАШ КОД ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ:
    displayRelatedPeople() {
        const relatedPeople = this.allData.people.filter(person => 
            (person.birth && person.birth.place_id === this.placeId) ||
            (person.death && person.death.place_id === this.placeId)
        );

        const container = document.getElementById('related-people');
        
        if (relatedPeople.length === 0) {
            container.innerHTML = '<p>Нет связанных людей</p>';
            return;
        }

        let html = '<div class="people-list">';
        relatedPeople.forEach(person => {
            const relation = this.getPersonRelation(person);
            html += `
                <a href="biography.html?id=${person.id}" class="person-card-link">
                    <div class="person-card">
                        <h4>${person.full_name}</h4>
                    </div>
                </a>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    getPersonRelation(person) {
        if (person.birth && person.birth.place_id === this.placeId) {
            return '📍 Родился здесь';
        }
        if (person.death && person.death.place_id === this.placeId) {
            return '⚰️ Умер здесь';
        }
        return 'Связан с этим местом';
    }

    formatPlaceType(type) {
        const typeMap = {
            'settlement': 'Населённый пункт',
            'village': 'Деревня',
            'city': 'Город',
            'station': 'Станция',
            'area': 'Местность'
        };
        return typeMap[type] || type;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    new PlaceViewer();
});