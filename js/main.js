const { createApp, ref, computed, onMounted, watch } = Vue;

const Card = {
    props: ['card', 'column'],
    emits: ['toggleItem', 'deleteCard', 'updateTitle'],
    template: `
        <div class="card" :style="cardStyle">
            <div class="card-header">
                <input 
                    type="text" 
                    :value="card.title" 
                    @change="$emit('updateTitle', card.id, column, $event.target.value)"
                    class="card-title"
                >
                <button 
                    @click="$emit('deleteCard', card.id, column)" 
                    class="delete-btn">-</button>
            </div>
            
            <ul class="card-list">
                <li v-for="(item, index) in card.items" :key="index">
                    <input 
                        type="checkbox" 
                        :checked="item.completed"
                        @change="$emit('toggleItem', card.id, column, index)"
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
            } else if (percent > 50) {
                return {
                    borderLeft: '4px solid #FF9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.08)'
                };
            }
            return {};
        }
    }
};

const App = {
    components: {
        Card
    },
    setup() {
        const cards = ref({
            1: [],
            2: [],
            3: []
        });
        
        const cardIdCounter = ref(1);
        const newCardTitle = ref('');
        const newCardItems = ref(['', '', '']);
        
        const column1Cards = computed(() => cards.value[1]);
        const column2Cards = computed(() => cards.value[2]);
        const column3Cards = computed(() => cards.value[3]);
        
        const canCreateCard = computed(() => {
            return (
                newCardTitle.value.trim() !== '' &&
                newCardItems.value.filter(item => item.trim() !== '').length >= 3 &&
                newCardItems.value.filter(item => item.trim() !== '').length <= 5 &&
                cards.value[1].length < 3
            );
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
        
        function addItemInput() {
            if (newCardItems.value.length >= 5) {
                alert('Максимум 5 пунктов!');
                return;
            }
            newCardItems.value.push('');
        }
        
        function removeItemInput(index) {
            if (newCardItems.value.length > 3) {
                newCardItems.value.splice(index, 1);
            } else {
                alert('Минимальное количество пунктов - 3!');
            }
        }
        
        function createCard() {
            if (!canCreateCard.value) {
                if (newCardTitle.value.trim() === '') {
                    alert('Введите заголовок!');
                } else if (newCardItems.value.filter(item => item.trim() !== '').length < 3) {
                    alert('Нужно минимум 3 пункта!');
                } else {
                    alert('В первом столбце не может быть больше 3 карточек!');
                }
                return;
            }
            
            const items = newCardItems.value
                .map(text => text.trim())
                .filter(text => text !== '')
                .map(text => ({ text, completed: false }));
            
            const newCard = {
                id: cardIdCounter.value++,
                title: newCardTitle.value.trim(),
                items: items,
                completedAt: null
            };
            
            cards.value[1].push(newCard);
            
            newCardTitle.value = '';
            newCardItems.value = ['', '', ''];
        }
        
        function handleToggleItem(cardId, column, itemIndex) {
            const card = cards.value[column].find(c => c.id === cardId);
            if (!card) return;
            
            card.items[itemIndex].completed = !card.items[itemIndex].completed;
            
            const completed = card.items.filter(i => i.completed).length;
            const total = card.items.length;
            const percent = (completed / total) * 100;
            
            if (column === 1 && percent > 50) {
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
            if (confirm('Удалить карточку?')) {
                cards.value[column] = cards.value[column].filter(c => c.id !== cardId);
            }
        }
        
        function handleUpdateTitle(cardId, column, newTitle) {
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
            newCardTitle,
            newCardItems,
            column1Cards,
            column2Cards,
            column3Cards,
            canCreateCard,
            addItemInput,
            removeItemInput,
            createCard,
            handleToggleItem,
            handleDeleteCard,
            handleUpdateTitle
        };
    }
};

createApp(App).mount('#app');