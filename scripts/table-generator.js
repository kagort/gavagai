// Ждем загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    loadTable();
});

async function loadTable() {
    try {
        // Загружаем данные из JSON файла
        const response = await fetch('data/meetings.json');
        const data = await response.json();
        
        // Находим тело таблицы в HTML
        const tbody = document.querySelector('#meetings-table tbody');
        
        // Очищаем старые данные
        tbody.innerHTML = '';
        
        // Для каждой встречи создаем строку таблицы
        data.meetings.forEach(meeting => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${meeting.number}</td>
                <td>${meeting.date}</td>
                <td>${meeting.topic}</td>
                <td>${generateLiteratureHTML(meeting.literature, meeting.additionalMaterials)}</td>
                <td>${formatTextWithLineBreaks(meeting.materials)}</td>
                <td>${formatTextWithLineBreaks(meeting.plan)}</td>
            `;
            
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки таблицы:', error);
    }
}

// Функция для создания HTML списка литературы
function generateLiteratureHTML(literature, additionalMaterials = []) {
    // Проверяем есть ли вообще материалы
    const hasMainLiterature = literature && literature.length > 0;
    const hasAdditionalMaterials = additionalMaterials && additionalMaterials.length > 0;
    
    if (!hasMainLiterature && !hasAdditionalMaterials) {
        return '<em>Материалы не добавлены</em>';
    }
    
    let html = '';
    
    // Основная литература
    if (hasMainLiterature) {
        literature.forEach((item, index) => {
            html += `${index + 1}. <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a><br>`;
        });
    }
    
    // Дополнительные материалы
    if (hasAdditionalMaterials) {
        // Добавляем отступ если есть основная литература
        if (hasMainLiterature) {
            html += '<br>';
        }
        
        html += '<strong> Доп материалы</strong><br>';
        additionalMaterials.forEach((item, index) => {
            html += `${index + 1}. <a href="${item.url}" target="_blank" rel="noopener">${item.title}</a><br>`;
        });
    }
    
    return html;
}

// Функция для замены переносов строк на <br>
function formatTextWithLineBreaks(text) {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
}