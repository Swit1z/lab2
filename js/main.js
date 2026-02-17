const { createApp } = Vue;

const EventBus = {
    events: {},
    emit(event, payload) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(payload));
        }
    },
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
};

const Card = {
    props: ['card', 'column', 'blocked'],
    template: `
        <div class="card" :style="cardStyle" :class="{ 'blocked-card': blocked }">
            <input
                type="text"
                :value="card.title"
                @change="onTitleChange"
                class="card-title"
                :disabled="blocked"
            >
            <button
                @click="onDelete"
                class="delete-btn"
                :disabled="blocked"
            >-</button>
            <ul class="card-list">
                <li v-for="(item, index) in card.items" :key="index">
                    <input 
                        type="checkbox" 
                        :checked="item.completed"
                        @click.prevent="onToggle(index)"
                        :disabled="blocked"
                    >
                    <span :class="{ completed: item.completed }">{{ item.text }}</span>
                </li>
            </ul>
            <div v-if="card.completedAt" class="completion-info">
                Завершено: {{ formatDate(card.completedAt) }}
            </div>
        </div>
    `,
    methods: {
        formatDate(dateString) {
            return new Date(dateString).toLocaleString('ru-RU');
        },
        onToggle(index) {
            if (this.card.items[index].completed) {
                return;
            }
            if (!this.blocked) {
                EventBus.emit('toggleItem', { cardId: this.card.id, column: this.column, index });
            }
        },
        onDelete() {
            if (!this.blocked) {
                EventBus.emit('deleteCard', { cardId: this.card.id, column: this.column });
            }
        },
        onTitleChange(event) {
            if (!this.blocked) {
                EventBus.emit('updateTitle', { cardId: this.card.id, column: this.column, title: event.target.value });
            }
        }
    },
    computed: {
        cardStyle() {
            const completed = this.card.items.filter(i => i.completed).length;
            const total = this.card.items.length;
            const percent = total === 0 ? 0 : (completed / total) * 100;
            
            if (percent === 100) {
                return { 
                    borderLeft: '4px solid #4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.08)'
                };
            } else if (percent >= 50) {
                return {
                    borderLeft: '4px solid #FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.08)'
                };
            }
            return {}; 
        }
    }
};

const Column = {
    props: ['title', 'columnId', 'cards', 'maxCards', 'blocked'],
    components: { Card },
    template: `
        <div class="column" :class="{ 'blocked-column': blocked }">
            <h3>{{ title }}</h3>
            <div class="column-cards">
                <Card 
                    v-for="card in cards" 
                    :key="card.id" 
                    :card="card" 
                    :column="columnId"
                    :blocked="blocked"
                />
            </div>
            <div v-if="maxCards" class="column-limit">
                {{ cards.length }} / {{ maxCards }}
            </div>
            <div v-if="blocked" class="blocked-overlay">
                <div class="blocked-message">
                     Второй столбец заполнен!<br>Освободите место для продолжения работы
                </div>
            </div>
        </div>
    `
};

const CardCreator = {
    props: ['canCreate'],
    template: `
        <div class="create-section">
            <h2>Новые задачи (мин 3)</h2>
            <input 
                v-model="localTitle" 
                type="text" 
                placeholder="Заголовок карточки"
                class="title-input"
            >
            <div class="items-input">
                <div v-for="(item, index) in localItems" :key="index" class="item-row">
                    <input 
                        v-model="localItems[index]" 
                        type="text" 
                        placeholder="Пункт задачи"
                        @keydown.enter="onAddItem"
                    >
                    <button 
                        v-if="localItems.length > 3" 
                        @click="onRemoveItem(index)"
                        class="remove-item-btn"
                    >-</button>
                </div>
            </div>
            <button 
                @click="onAddItem" 
                :disabled="localItems.length >= 5"
                class="add-item-btn"
            >
                + Добавить пункт
            </button>
            <button 
                @click="onCreateCard" 
                :disabled="!canCreate"
                class="create-btn"
            >
                Создать карточку
            </button>
        </div>
    `,
    data() {
        return {
            localTitle: '',
            localItems: ['', '', '']
        };
    },
    computed: {
        canCreate() {
            const validItems = this.localItems.filter(item => item.trim() !== '').length;
            return (
                this.localTitle.trim() !== '' &&
                validItems >= 3 &&
                validItems <= 5
            );
        }
    },
    methods: {
        onAddItem() {
            if (this.localItems.length >= 5) {
                alert('Максимум 5 пунктов!');
                return;
            }
            this.localItems.push('');
        },
        onRemoveItem(index) {
            if (this.localItems.length > 3) {
                this.localItems.splice(index, 1);
            } else {
                alert('Минимальное количество пунктов - 3!');
            }
        },
        onCreateCard() {
            const title = this.localTitle.trim();
            const items = this.localItems
                .map(text => text.trim())
                .filter(text => text !== '')
                .map(text => ({ text, completed: false }));
            
            if (title === '') {
                alert('Введите заголовок!');
                return;
            }
            
            if (items.length < 3) {
                alert('Нужно минимум 3 пункта!');
                return;
            }
            
            if (items.length > 5) {
                alert('Максимум 5 пунктов!');
                return;
            }
            
            const cardData = {
                title: title,
                items: items
            };
            
            EventBus.emit('createCard', cardData);
            
            this.localTitle = '';
            this.localItems = ['', '', ''];
        }
    }
};

const App = {
    components: { Column, CardCreator },
    template: `
        <div class="app">
            <h1>Приложение для заметок</h1>
            
            <CardCreator 
                :canCreate="canCreateCard"
            />
            
            <div class="board">
                <Column 
                    title="Новые задачи (макс 3)"
                    :columnId="1"
                    :cards="column1Cards"
                    :maxCards="3"
                    :blocked="isColumn2Full"
                />
                <Column 
                    title="В работе (макс 5)"
                    :columnId="2"
                    :cards="column2Cards"
                    :maxCards="5"
                    :blocked="false"
                />
                <Column 
                    title="Завершено"
                    :columnId="3"
                    :cards="column3Cards"
                    :blocked="false"
                />
            </div>
        </div>
    `,
    data() {
        return {
            cards: {
                1: [],
                2: [],
                3: []
            },
            cardIdCounter: 1
        };
    },
    computed: {
        column1Cards() {
            return this.cards[1];
        },
        column2Cards() {
            return this.cards[2];
        },
        column3Cards() {
            return this.cards[3];
        },
        isColumn2Full() {
            return this.cards[2].length >= 5;
        },
        canCreateCard() {
            return this.cards[1].length < 3;
        }
    },
    methods: {
        loadCards() {
            const savedCards = localStorage.getItem('notesCards');
            const savedIdCounter = localStorage.getItem('notesCardIdCounter');
            
            if (savedCards) {
                this.cards = JSON.parse(savedCards);
            }
            
            if (savedIdCounter) {
                this.cardIdCounter = parseInt(savedIdCounter);
            }
        },
        saveCards() {
            localStorage.setItem('notesCards', JSON.stringify(this.cards));
            localStorage.setItem('notesCardIdCounter', this.cardIdCounter.toString());
        },
        handleCreateCard(cardData) {
            if (!cardData.title || !cardData.items || cardData.items.length === 0) {
                alert('Невозможно создать пустую карточку!');
                return;
            }
            
            if (this.cards[1].length >= 3) {
                alert('В первом столбце не может быть больше 3 карточек!');
                return;
            }
            
            const newCard = {
                id: this.cardIdCounter++,
                title: cardData.title,
                items: cardData.items,
                completedAt: null
            };
            
            this.cards[1].push(newCard);
        },
        handleToggleItem(payload) {
            const { cardId, column, index } = payload;
            
            if (this.isColumn2Full && column === 1) {
                alert('Второй столбец заполнен! Освободите место для продолжения работы.');
                return;
            }
            
            const card = this.cards[column].find(c => c.id === cardId);
            if (!card) return;
            
            card.items[index].completed = !card.items[index].completed;
            
            const completed = card.items.filter(i => i.completed).length;
            const total = card.items.length;
            const percent = total === 0 ? 0 : (completed / total) * 100;
            
            if (column === 1 && percent >= 50) {
                if (this.cards[2].length >= 5) {
                    alert('Второй столбец заполнен! Дождитесь освобождения места.');
                } else {
                    this.moveToColumn(cardId, 1, 2);
                }
            } else if (percent === 100) {
                card.completedAt = new Date().toISOString();
                this.moveToColumn(cardId, column, 3);
            }
        },
        handleDeleteCard(payload) {
            const { cardId, column } = payload;
            
            if (this.isColumn2Full && column === 1) {
                alert('Второй столбец заполнен! Освободите место для продолжения работы.');
                return;
            }
            
            if (confirm('Удалить карточку?')) {
                this.cards[column] = this.cards[column].filter(c => c.id !== cardId);
            }
        },
        handleUpdateTitle(payload) {
            const { cardId, column, title } = payload;
            
            if (this.isColumn2Full && column === 1) return;
            
            const card = this.cards[column].find(c => c.id === cardId);
            if (card) {
                card.title = title;
            }
        },
        moveToColumn(cardId, from, to) {
            const index = this.cards[from].findIndex(c => c.id === cardId);
            if (index === -1) return;
            
            const card = this.cards[from][index];
            this.cards[from].splice(index, 1);
            this.cards[to].push({ ...card });
        },
        setupEventBus() {
            EventBus.on('createCard', this.handleCreateCard);
            EventBus.on('toggleItem', this.handleToggleItem);
            EventBus.on('deleteCard', this.handleDeleteCard);
            EventBus.on('updateTitle', this.handleUpdateTitle);
        },
        cleanupEventBus() {
            EventBus.off('createCard', this.handleCreateCard);
            EventBus.off('toggleItem', this.handleToggleItem);
            EventBus.off('deleteCard', this.handleDeleteCard);
            EventBus.off('updateTitle', this.handleUpdateTitle);
        }
    },
    mounted() {
        this.loadCards();
        this.setupEventBus();
    },
    beforeUnmount() {
        this.cleanupEventBus();
    },
    watch: {
        cards: {
            handler() {
                this.saveCards();
            },
            deep: true
        },
        cardIdCounter() {
            this.saveCards();
        }
    }
};

createApp(App).mount('#app');