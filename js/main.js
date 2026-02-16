const { createApp } = Vue;

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
            const percent = total > 0 ? (completed / total) * 100 : 0;
            
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
    name: 'CardCreator',
    props: ['canCreate'],
    emits: ['createCard'],
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
        }
    },
    computed: {
        canCreateComputed() {
            const validTitle = this.localTitle.trim() !== ''
            const filledItems = this.localItems.filter(item => item.trim() !== '').length
            return validTitle && filledItems >= 3 && filledItems <= 5
        }
    },
    methods: {
        onAddItem() {
            if (this.localItems.length >= 5) {
                alert('Максимум 5 пунктов!')
                return
            }
            this.localItems.push('')
        },
        onRemoveItem(index) {
            if (this.localItems.length > 3) {
                this.localItems.splice(index, 1)
            } else {
                alert('Минимальное количество пунктов - 3!')
            }
        },
        onCreateCard() {
            if (!this.canCreateComputed) {
                if (this.localTitle.trim() === '') {
                    alert('Введите заголовок!')
                } else if (this.localItems.filter(item => item.trim() !== '').length < 3) {
                    alert('Нужно минимум 3 пункта!')
                }
                return
            }
            
            const items = this.localItems
                .map(text => text.trim())
                .filter(text => text !== '')
                .map(text => ({ text, completed: false }))
            
            const cardData = {
                title: this.localTitle.trim(),
                items: items
            }
            
            this.$emit('createCard', cardData)
            
            this.localTitle = ''
            this.localItems = ['', '', '']
        }
    }
};

//fdfdfdfdfdf
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

    //fdfdfdffdd

    data() {
        return {
            cards: {
                1: [],
                2: [],
                3: []
            },
            cardIdCounter: 1
        }
    },
    computed: {
        column1Cards() {
            return this.cards[1]
        },
        column2Cards() {
            return this.cards[2]
        },
        column3Cards() {
            return this.cards[3]
        },
        isColumn2Full() {
            return this.cards[2].length >= 5
        },
        canCreateCard() {
            return this.cards[1].length < 3
        }
    },
    watch: {
        cards: {
            handler() {
                this.saveCards()
            },
            deep: true
        },
        cardIdCounter() {
            this.saveCards()
        }
    },
    mounted() {
        this.loadCards()
    },
    methods: {
        loadCards() {
            const savedCards = localStorage.getItem('notesCards')
            const savedIdCounter = localStorage.getItem('notesCardIdCounter')

            if (savedCards) {
                this.cards = JSON.parse(savedCards)
            }

            if (savedIdCounter) {
                this.cardIdCounter = parseInt(savedIdCounter)
            }
        },
        saveCards() {
            localStorage.setItem('notesCards', JSON.stringify(this.cards))
            localStorage.setItem('notesCardIdCounter', this.cardIdCounter.toString())
        },
        handleCreateCard(cardData) {
            if (this.cards[1].length >= 3) {
                alert('В первом столбце не может быть больше 3 карточек!')
                return
            }

            const newCard = {
                id: this.cardIdCounter++,
                title: cardData.title,
                items: cardData.items,
                completedAt: null
            }

            this.cards[1].push(newCard)
        },
        handleToggleItem(cardId, column, itemIndex) {
            if (this.isColumn2Full && column === 1) {
                alert('Второй столбец заполнен! Освободите место для продолжения работы.')
                return
            }

            const card = this.cards[column].find(c => c.id === cardId)
            if (!card) return

            card.items[itemIndex].completed = !card.items[itemIndex].completed

            const completed = card.items.filter(i => i.completed).length
            const total = card.items.length
            if (total === 0) return

            const percent = (completed / total) * 100

if (column === 1 && percent >= 50) {
                if (this.cards[2].length >= 5) {
                    alert('Второй столбец заполнен! Дождитесь освобождения места.')
                } else {
                    this.moveToColumn(cardId, 1, 2)
                }
            } else if (percent === 100) {
                card.completedAt = new Date().toISOString()
                this.moveToColumn(cardId, column, 3)
            }
        },
        handleDeleteCard(cardId, column) {
            if (this.isColumn2Full && column === 1) {
                alert('Второй столбец заполнен! Освободите место для продолжения работы.')
                return
            }

            if (confirm('Удалить карточку?')) {
                this.cards[column] = this.cards[column].filter(c => c.id !== cardId)
            }
        },
        handleUpdateTitle(cardId, column, newTitle) {
            if (this.isColumn2Full && column === 1) return

            const card = this.cards[column].find(c => c.id === cardId)
            if (card) {
                card.title = newTitle
            }
        },
        moveToColumn(cardId, from, to) {
            const index = this.cards[from].findIndex(c => c.id === cardId)
            if (index === -1) return

            const card = this.cards[from][index]
            this.cards[from].splice(index, 1)
            this.cards[to].push({ ...card })
        }
    }
}

createApp(App).mount('#app');


//fdfdf
//fdfdfdf