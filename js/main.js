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
    
    const title = document.createElement('h3');
    title.textContent = card.title;
    div.appendChild(title);
    
    const list = document.createElement('ul');
    card.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.text;
        list.appendChild(li);
    });
    div.appendChild(list);
    
    return div;
}