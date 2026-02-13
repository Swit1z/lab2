const { createApp, ref, computed, onMounted, watch } = Vue;


const Card = {
    props: ['card', 'column', 'blocked'],
    emits: ['toggleItem', 'deleteCard', 'updateTitle'],
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
                @click="$emit('deleteCard', card.id, column)"
                class="delete-btn"
                :disabled="blocked"
            >-</button>
            <ul class="card-list">
                <li v-for="(item, index) in card.items" :key="index">
                    <input 
                        type="checkbox" 
                        :checked="item.completed"
                        @change="onToggle(index)"
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
            if (!this.blocked) {
                this.$emit('toggleItem', this.card.id, this.column, index);
            }
        },
        onTitleChange(event) {
            if (!this.blocked) {
                this.$emit('updateTitle', this.card.id, this.column, event.target.value);
            }
        }
    },
    computed: {
        cardStyle() {
            const completed = this.card.items.filter(i => i.completed).length;
            const total = this.card.items.length;
            const percent = (completed / total) * 100;
            
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
    emits: ['toggleItem', 'deleteCard', 'updateTitle'],
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
                    @toggleItem="(cardId, col, index) => $emit('toggleItem', cardId, col, index)"
                    @deleteCard="(cardId, col) => $emit('deleteCard', cardId, col)"
                    @updateTitle="(cardId, col, title) => $emit('updateTitle', cardId, col, title)"
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
    emits: ['createCard', 'addItemInput', 'removeItemInput'],
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
    setup(props, { emit }) {
        const localTitle = ref('');
        const localItems = ref(['', '', '']);
        
        const canCreate = computed(() => {
            return (
                localTitle.value.trim() !== '' &&
                localItems.value.filter(item => item.trim() !== '').length >= 3 &&
                localItems.value.filter(item => item.trim() !== '').length <= 5
            );
        });
        
        function onAddItem() {
            if (localItems.value.length >= 5) {
                alert('Максимум 5 пунктов!');
                return;
            }
            localItems.value.push('');
        }
        
        function onRemoveItem(index) {
            if (localItems.value.length > 3) {
                localItems.value.splice(index, 1);
            } else {
                alert('Минимальное количество пунктов - 3!');
            }
        }
        
        function onCreateCard() {
            if (!canCreate.value) {
                if (localTitle.value.trim() === '') {
                    alert('Введите заголовок!');
                } else if (localItems.value.filter(item => item.trim() !== '').length < 3) {
                    alert('Нужно минимум 3 пункта!');
                }
                return;
            }
            
            const items = localItems.value
                .map(text => text.trim())
                .filter(text => text !== '')
                .map(text => ({ text, completed: false }));
            
            const cardData = {
                title: localTitle.value.trim(),
                items: items
            };
            
            emit('createCard', cardData);
            
            localTitle.value = '';
            localItems.value = ['', '', ''];
        }
        
        return {
            localTitle,
            localItems,
            canCreate,
            onAddItem,
            onRemoveItem,
            onCreateCard
        };
    }
};


const App = {
    components: { Column, CardCreator },
    template: `
        <div class="app">
            <h1>Приложение для заметок</h1>
            
            <CardCreator 
                :canCreate="canCreateCard"
                @createCard="handleCreateCard"
            />
            
            <div class="board">
                <Column 
                    title="Новые задачи (макс 3)"
                    :columnId="1"
                    :cards="column1Cards"
                    :maxCards="3"
                    :blocked="isColumn2Full"
                    @toggleItem="handleToggleItem"
                    @deleteCard="handleDeleteCard"
                    @updateTitle="handleUpdateTitle"
                />
                <Column 
                    title="В работе (макс 5)"
                    :columnId="2"
                    :cards="column2Cards"
                    :maxCards="5"
                    :blocked="false"
                    @toggleItem="handleToggleItem"
                    @deleteCard="handleDeleteCard"
                    @updateTitle="handleUpdateTitle"
                />
                <Column 
                    title="Завершено"
                    :columnId="3"
                    :cards="column3Cards"
                    :blocked="false"
                    @toggleItem="handleToggleItem"
                    @deleteCard="handleDeleteCard"
                    @updateTitle="handleUpdateTitle"
                />
            </div>
        </div>
    `,
    setup() {
        const cards = ref({
            1: [],
            2: [],
            3: []
        });
        const cardIdCounter = ref(1);
        
        const column1Cards = computed(() => cards.value[1]);
        const column2Cards = computed(() => cards.value[2]);
        const column3Cards = computed(() => cards.value[3]);
        
        const isColumn2Full = computed(() => cards.value[2].length >= 5);
        
        const canCreateCard = computed(() => {
            return cards.value[1].length < 3;
        });
        
        onMounted(() => {
            loadCards();
        });
        
        watch(cards, () => {
            saveCards();
        }, { deep: true });
        
        watch(cardIdCounter, () => {
            saveCards();
        });
        
        function loadCards() {
            const savedCards = localStorage.getItem('notesCards');
            const savedIdCounter = localStorage.getItem('notesCardIdCounter');
            
            if (savedCards) {
                cards.value = JSON.parse(savedCards);
            }
            
            if (savedIdCounter) {
                cardIdCounter.value = parseInt(savedIdCounter);
            }
        }
        
        function saveCards() {
            localStorage.setItem('notesCards', JSON.stringify(cards.value));
            localStorage.setItem('notesCardIdCounter', cardIdCounter.value.toString());
        }
        
        function handleCreateCard(cardData) {
            if (cards.value[1].length >= 3) {
                alert('В первом столбце не может быть больше 3 карточек!');
                return;
            }
            
            const newCard = {
                id: cardIdCounter.value++,
                title: cardData.title,
                items: cardData.items,
                completedAt: null
            };
            
            cards.value[1].push(newCard);
        }
        
        function handleToggleItem(cardId, column, itemIndex) {
            if (isColumn2Full.value && column === 1) {
                alert('Второй столбец заполнен! Освободите место для продолжения работы.');
                return;
            }
            
            const card = cards.value[column].find(c => c.id === cardId);
            if (!card) return;
            
            card.items[itemIndex].completed = !card.items[itemIndex].completed;
            
            const completed = card.items.filter(i => i.completed).length;
            const total = card.items.length;
            const percent = (completed / total) * 100;
            
            if (column === 1 && percent >= 50) {
                if (cards.value[2].length >= 5) {
                    alert('Второй столбец заполнен! Дождитесь освобождения места.');
                } else {
                    moveToColumn(cardId, 1, 2);
                }
            } else if (percent === 100) {
                card.completedAt = new Date().toISOString();
                moveToColumn(cardId, column, 3);
            }
        }
        
        function handleDeleteCard(cardId, column) {
            if (isColumn2Full.value && column === 1) {
                alert('Второй столбец заполнен! Освободите место для продолжения работы.');
                return;
            }
            
            if (confirm('Удалить карточку?')) {
                cards.value[column] = cards.value[column].filter(c => c.id !== cardId);
            }
        }
        
        function handleUpdateTitle(cardId, column, newTitle) {
            if (isColumn2Full.value && column === 1) return;
            
            const card = cards.value[column].find(c => c.id === cardId);
            if (card) {
                card.title = newTitle;
            }
        }
        
        function moveToColumn(cardId, from, to) {
            const index = cards.value[from].findIndex(c => c.id === cardId);
            if (index === -1) return;
            
            const card = cards.value[from][index];
            cards.value[from].splice(index, 1);
            cards.value[to].push({ ...card });
        }
        
        return {
            cards,
            cardIdCounter,
            column1Cards,
            column2Cards,
            column3Cards,
            canCreateCard,
            isColumn2Full,
            handleCreateCard,
            handleToggleItem,
            handleDeleteCard,
            handleUpdateTitle
        };
    }
};

createApp(App).mount('#app');