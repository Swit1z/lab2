let cards = {
    1: [],
    2: [],
    3: []
};
let cardId = 1;


document.addEventListener('DOMContentLoaded', () => {
    loadCards();
    renderAllColumns();
    setupEventListeners();
    checkLock();
});


function loadCards() {
    const saved = localStorage.getItem('cards');
    const savedId = localStorage.getItem('cardId');
    if (saved) cards = JSON.parse(saved);
    if (savedId) cardId = parseInt(savedId);
}


function saveCards() {
    localStorage.setItem('cards', JSON.stringify(cards));
    localStorage.setItem('cardId', cardId.toString());
}


function setupEventListeners() {
    document.getElementById('createCardBtn').addEventListener('click', createCard);
    document.getElementById('addItemBtn').addEventListener('click', addItemInput);
}


function addItemInput() {
    const container = document.getElementById('itemsContainer');
    if (container.children.length >= 5) {
        alert('Максимум 5 пунктов!');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'item-input';
    input.placeholder = `Пункт ${container.children.length + 1}`;
    container.appendChild(input);
}


function createCard() {
    const title = document.getElementById('cardTitle').value.trim();
    const itemInputs = document.querySelectorAll('.item-input');
    
   
    if (!title) {
        alert('Введите заголовок!');
        return;
    }
    
    
    const items = Array.from(itemInputs)
        .map(input => input.value.trim())
        .filter(text => text !== '');
    
    if (items.length < 3) {
        alert('Нужно минимум 3 пункта!');
        return;
    }
    
    if (items.length > 5) {
        alert('Максимум 5 пунктов!');
        return;
    }
    
    
    if (cards[1].length >= 3) {
        alert('В первом столбце не может быть больше 3 карточек!');
        return;
    }
    
    
    const newCard = {
        id: cardId++,
        title: title,
        items: items.map(text => ({ text, completed: false })),
        completedAt: null
    };
    
    cards[1].push(newCard);
    saveCards();
    renderAllColumns();
    checkLock();
    
   
    document.getElementById('cardTitle').value = '';
    const container = document.getElementById('itemsContainer');
    container.innerHTML = `
        <input type="text" class="item-input" placeholder="Пункт 1">
        <input type="text" class="item-input" placeholder="Пункт 2">
        <input type="text" class="item-input" placeholder="Пункт 3">
    `;
}


function renderAllColumns() {
    for (let col = 1; col <= 3; col++) {
        renderColumn(col);
    }
}


function renderColumn(column) {
    const container = document.getElementById(`cards${column}`);
    container.innerHTML = '';
    
    cards[column].forEach(card => {
        container.appendChild(createCardElement(card, column));
    });
}


function createCardElement(card, column) {
    const div = document.createElement('div');
    div.className = 'card';
    div.dataset.id = card.id;
    div.dataset.column = column;
    
  
    const header = document.createElement('div');
    header.className = 'card-header';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'card-title';
    titleInput.value = card.title;
    titleInput.onchange = (e) => {
        card.title = e.target.value;
        saveCards();
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '-';
    deleteBtn.onclick = () => deleteCard(card.id, column);
    
    header.appendChild(titleInput);
    header.appendChild(deleteBtn);
    div.appendChild(header);
    
   
    const list = document.createElement('ul');
    list.className = 'card-list';
    
    card.items.forEach((item, index) => {
        const li = document.createElement('li');
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.completed;
        checkbox.onchange = () => toggleItem(card.id, column, index);
        
        const span = document.createElement('span');
        span.textContent = item.text;
        if (item.completed) span.className = 'completed';
        
        li.appendChild(checkbox);
        li.appendChild(span);
        list.appendChild(li);
    });
    
    div.appendChild(list);
    
   
    if (card.completedAt) {
        const info = document.createElement('div');
        info.className = 'completion-info';
        info.textContent = `Завершено: ${new Date(card.completedAt).toLocaleString('ru-RU')}`;
        div.appendChild(info);
    }
    
    
    const completed = card.items.filter(i => i.completed).length;
    const total = card.items.length;
    const percent = (completed / total) * 100;
    
    if (percent === 100) {
        div.style.borderLeft = '4px solid #4CAF50';
    } else if (percent > 50) {
        div.style.borderLeft = '4px solid #FF9800';
    }
    
    return div;
}


function toggleItem(cardId, column, itemIndex) {
    const card = cards[column].find(c => c.id === cardId);
    if (!card) return;
    
    card.items[itemIndex].completed = !card.items[itemIndex].completed;
    
   
    const completed = card.items.filter(i => i.completed).length;
    const total = card.items.length;
    const percent = (completed / total) * 100;
    
    
    if (column === 1 && percent > 50) {
        moveToColumn(cardId, 1, 2);
    } else if (percent === 100) {
        card.completedAt = new Date().toISOString();
        moveToColumn(cardId, column, 3);
    }
    
    saveCards();
    renderAllColumns();
    checkLock();
}


function moveToColumn(cardId, from, to) {
    const index = cards[from].findIndex(c => c.id === cardId);
    if (index === -1) return;
    
    const card = cards[from][index];
    cards[from].splice(index, 1);
    cards[to].push(card);
}


function deleteCard(cardId, column) {
    if (confirm('Удалить карточку?')) {
        cards[column] = cards[column].filter(c => c.id !== cardId);
        saveCards();
        renderAllColumns();
        checkLock();
    }
}


function checkLock() {
    const col1 = document.getElementById('column1');
    const isCol2Full = cards[2].length >= 5;
    const hasOver50 = cards[1].some(card => {
        const completed = card.items.filter(i => i.completed).length;
        return (completed / card.items.length) * 100 > 50;
    });
    
    if (isCol2Full && hasOver50) {
        col1.classList.add('locked');
    } else {
        col1.classList.remove('locked');
    }
}