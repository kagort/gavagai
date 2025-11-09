// Ждем загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    loadMaterials();
});

async function loadMaterials() {
    try {
        console.log('📚 Загружаем материалы...');
        
        // Загружаем данные из JSON файла
        const response = await fetch('data/materials.json');
        const data = await response.json();
        
        // Находим контейнер для материалов
        const mainContainer = document.querySelector('main.content');
        
        if (!mainContainer) {
            throw new Error('Не найден main контейнер');
        }
        
        // Очищаем старый контент (оставляем только то, что нужно)
        const oldMaterials = mainContainer.querySelectorAll('details, article');
        oldMaterials.forEach(element => element.remove());
        
        // Создаем аккордеон с материалами
        createMaterialsAccordion(data.materials, mainContainer);
        
        console.log('✅ Материалы загружены и отображены!');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки материалов:', error);
        
        // Показываем сообщение об ошибке
        const mainContainer = document.querySelector('main.content');
        if (mainContainer) {
            mainContainer.innerHTML += `
                <div style="text-align: center; padding: 40px; color: red;">
                    Ошибка загрузки материалов: ${error.message}
                </div>
            `;
        }
    }
}

// Функция для создания аккордеона с материалами
function createMaterialsAccordion(materials, container) {
    materials.forEach(material => {
        // Создаем элемент details для каждой встречи
        const details = document.createElement('details');
        details.className = 'material-section';
        
        // Создаем summary (заголовок аккордеона)
        const summary = document.createElement('summary');
        summary.textContent = material.title;
        details.appendChild(summary);
        
        // Добавляем секции материала
        material.sections.forEach((section, index) => {
            const article = document.createElement('article');
            article.className = 'material-content';
            
            // Добавляем заголовок секции
            const title = document.createElement('h2');
            title.textContent = section.title;
            article.appendChild(title);
            
            // Добавляем контент секции
            section.content.forEach(content => {
                const paragraph = document.createElement('div');
                paragraph.className = 'typography-text';
                paragraph.innerHTML = content;
                article.appendChild(paragraph);
            });
            
            details.appendChild(article);
        });
        
        container.appendChild(details);
    });
}