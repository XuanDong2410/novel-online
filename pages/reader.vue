<template>
    <div class="reader" :class="{ 'dark-mode': isDarkMode }">
      <!-- Header -->
      <header class="header">
        <div class="header-content">
          <h1 class="title">Story Reader</h1>
          <button @click="toggleDarkMode" class="dark-mode-toggle">
            <component :is="isDarkMode ? Sun : Moon" class="icon" />
          </button>
        </div>
      </header>
  
      <!-- Main content -->
      <main class="main-content">
        <div class="story-container">
          <div class="story-content">
            <h2 class="story-title">{{ story.title }}</h2>
            <p class="story-author">By {{ story.author }}</p>
            <div class="story-text" v-html="story.content"></div>
          </div>
        </div>
  
        <!-- Navigation buttons -->
        <div class="navigation">
          <button
            @click="previousChapter"
            class="nav-button"
            :disabled="currentChapter === 1"
          >
            Previous Chapter
          </button>
          <button
            @click="nextChapter"
            class="nav-button"
            :disabled="currentChapter === totalChapters"
          >
            Next Chapter
          </button>
        </div>
      </main>
  
      <!-- Footer -->
      <footer class="footer">
        <div class="footer-content">
          <p>© 2024 Story Reader. All rights reserved.</p>
        </div>
      </footer>
    </div>
  </template>
  

  
<script lang="ts" setup>
import { ref } from 'vue';
import { Sun, Moon } from 'lucide-vue-next'; // Đảm bảo thư viện đã được cài đặt

// Simulated story data
const story = ref({
  title: "The Adventure Begins",
  author: "John Doe",
  content: `
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
  `,
});

const currentChapter = ref(1);
const totalChapters = 10;

const isDarkMode = ref(false);

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.body.classList.toggle('dark-mode', isDarkMode.value);
};

const previousChapter = () => {
  if (currentChapter.value > 1) {
    currentChapter.value--;
    console.log(`Fetching chapter ${currentChapter.value}`);
  }
};

const nextChapter = () => {
  if (currentChapter.value < totalChapters) {
    currentChapter.value++;
    console.log(`Fetching chapter ${currentChapter.value}`);
  }
};
</script>

 <style scoped>
.reader {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.header {
  background-color: var(--header-bg-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem;
}

.title {
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--text-color);
}

.dark-mode-toggle {
  background-color: var(--button-bg-color);
  border: none;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--icon-color);
}

.main-content {
  flex-grow: 1;
  padding: 2rem 1rem;
  max-width: 1280px;
  margin: 0 auto;
}

.story-container {
  background-color: var(--story-bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.story-content {
  padding: 1.5rem;
}

.story-title {
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.story-author {
  font-size: 1rem;
  color: var(--text-muted-color);
  margin-bottom: 1rem;
}

.story-text {
  color: var(--text-color);
  line-height: 1.75;
}

.navigation {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
}

.nav-button {
  background-color: var(--primary-color);
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

.nav-button:hover {
  background-color: var(--primary-hover-color);
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.footer {
  background-color: var(--footer-bg-color);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.footer-content {
  text-align: center;
  color: var(--text-muted-color);
}

/* Dark mode */
body.dark-mode {
  --bg-color: #1e1e1e;
  --text-color: #f5f5f5;
  --header-bg-color: #333;
  --button-bg-color: #3b82f6;
  --icon-color: #f5f5f5;
  --story-bg-color: #2d2d2d;
  --text-muted-color: #9e9e9e;
  --primary-color: #3b82f6;
  --primary-hover-color: #2563eb;
  --footer-bg-color: #333;
}

</style>