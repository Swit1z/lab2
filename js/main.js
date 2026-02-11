
let cards = {
    1: [],
    2: [],
    3: []
};
let cardId = 1;


document.addEventListener('DOMContentLoaded', () => {
    loadCards();
    renderAllColumns();
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

//dfdfdfd