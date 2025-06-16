<template>
  <div class="py-5">
    <div class="text-2xl font-bold text-[#4B3A8C] text-center mb-5">
      Novel Online
    </div>
    <!-- Current -->
    <div class="px-3 py-2">
      <div class="text-lg font-semibold text-[#4B3A8C] mb-2">
        Currently reading
      </div>
      <div
        class="rounded-3xl bg-[#F5E9D8] flex flex-nowrap items-center px-6 py-5 shadow-sm"
      >
        <!-- Left Section -->
        <div class="flex-1 min-w-0 pr-4">
          <div class="text-lg font-medium text-[#4B3A8C]">Unseen Shadow</div>
          <div class="text-sm text-gray-600">Terry Doyle</div>
          <div class="mt-1 text-sm text-gray-600 flex items-center">
            <svg
              class="w-4 h-4 text-yellow-400 mr-1"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 22 20"
            >
              <path
                d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"
              />
            </svg>
            <span>4.5/5.0</span>
          </div>
          <button
            class="mt-2 bg-[#4B3A8C] text-white text-sm font-medium rounded-full px-5 py-2"
          >
            Continue Reading
          </button>
          <div class="mt-3 text-sm text-gray-600">{{ value }}% complete</div>
          <v-range-slider
            class="my-3"
            :v-model="value"
            min="0"
            max="100"
            step="1"
            thumb-label
            thumb-size="20"
            track-color="#D3D3D3"
            thumb-color="#4B3A8C"
            track-fill-color="#4B3A8C"
          />
        </div>
        <!-- Right Section (Book Cover) -->
        <div class="w-28 flex-shrink-0">
          <img
            class="w-full rounded-2xl shadow-md"
            src='https://assets.api.uizard.io/api/cdn/stream/440be236-a82a-404e-bd97-69c3eddfed34.png"'
            alt="Book Cover"
          />
        </div>
      </div>
    </div>
    <!-- Want to Read -->
    <div class="py-2">
      <!-- Section Title -->
      <div class="px-3 text-lg font-semibold text-[#4B3A8C] mb-2">
        Want to Read
      </div>
      <v-sheet class="mx-2 bg-transparent">
        <v-slide-group v-model="selectedBookId" show-arrows>
          <v-slide-group-item v-for="book in books" :key="book.id">
            <div
              class="ml-2 flex flex-col items-center relative cursor-pointer"
              @click="selectBook(book)"
            >
              <!-- Book Card Background (Lower Half) -->
              <div
                class="w-[155px] h-[100px] bg-[#F5E9D8] rounded-2xl relative z-0 mt-[90px]"
              ></div>

              <!-- Floating Book Cover with Overlay -->
              <div
                class="absolute transform translate-y-1/7 rounded-xl overflow-hidden shadow-lg w-[120px] h-[155px] z-10"
              >
                <img
                  :src="book.cover"
                  alt="Book Cover"
                  class="w-full h-full object-cover"
                />

                <!-- Overlay for Title & Author -->
                <div
                  class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/50 to-transparent p-2"
                >
                  <div class="text-white text-xs font-semibold text-center">
                    {{ book.title }}
                  </div>
                  <div class="text-gray-300 text-[10px] text-center">
                    {{ book.author }}
                  </div>
                </div>
              </div>
            </div>
          </v-slide-group-item>
        </v-slide-group>

        <!-- Expandable Book Detail -->
        <v-expand-transition>
          <v-sheet
            v-if="selectedBook"
            class="bg-transparent shadow-lg transition-all duration-500 ease-out opacity-0 translate-y-5"
            :class="{ 'opacity-100 translate-y-0': selectedBook }"
          >
            <div
              class="rounded-3xl bg-[#F5E9D8] flex items-center py-7 shadow-sm relative px-6"
            >
              <!-- Left Section: Text -->
              <div class="flex-1 justify-start min-w-0 pr-6">
                <div class="text-lg font-bold text-[#4B3A8C]">
                  {{ selectedBook.title }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ selectedBook.author }}
                </div>

                <div class="mt-3 text-sm text-gray-600">
                  {{ selectedBook.description }}
                </div>
                
                <button
                  tonal
                  class="mt-2 bg-[#4B3A8C] text-white text-sm font-medium rounded-full px-3 py-2"
                >
                  Continue Reading
                </button>
              </div>

              <!-- Right Section: Book Cover -->
              <div class="w-40 flex-shrink-0">
                <img
                  class="w-full rounded-2xl shadow-md"
                  :src="selectedBook.cover"
                  alt="Book Cover"
                />
              </div>

              <!-- Close Button -->
              <button
                class="absolute bottom-0 right-4 text-gray-500 hover:text-gray-700"
                @click="closeBookDetail"
              >
                <v-icon icon="mdi-chevron-up" class="text-2xl" />
              </button>
            </div>
          </v-sheet>
        </v-expand-transition>
      </v-sheet>
    </div>
    <!-- Popular in Crime & Mystery -->
    <div class="py-2">
      <!-- Section Title -->
      <div class="px-3 text-lg font-semibold text-[#4B3A8C] mb-2">
        Popular in Crime & Mystery
      </div>
      <v-sheet class="mx-2 bg-transparent">
        <v-slide-group v-model="selectedBookId" show-arrows>
          <v-slide-group-item v-for="book in books" :key="book.id">
            <div
              class="ml-2 flex flex-col items-center relative cursor-pointer"
              @click="selectBook(book)"
            >
              <!-- Book Card Background (Lower Half) -->
              <div
                class="w-[155px] h-[100px] bg-[#F5E9D8] rounded-2xl relative z-0 mt-[90px]"
              ></div>

              <!-- Floating Book Cover with Overlay -->
              <div
                class="absolute transform translate-y-1/7 rounded-xl overflow-hidden shadow-lg w-[120px] h-[155px] z-10"
              >
                <img
                  :src="book.cover"
                  alt="Book Cover"
                  class="w-full h-full object-cover"
                />

                <!-- Overlay for Title & Author -->
                <div
                  class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/50 to-transparent p-2"
                >
                  <div class="text-white text-xs font-semibold text-center">
                    {{ book.title }}
                  </div>
                  <div class="text-gray-300 text-[10px] text-center">
                    {{ book.author }}
                  </div>
                </div>
              </div>
            </div>
          </v-slide-group-item>
        </v-slide-group>

        <!-- Expandable Book Detail -->
        <v-expand-transition>
          <v-sheet
            v-if="selectedBook"
            class="bg-transparent shadow-lg transition-all duration-500 ease-out opacity-0 translate-y-5"
            :class="{ 'opacity-100 translate-y-0': selectedBook }"
          >
            <div
              class="rounded-3xl bg-[#F5E9D8] flex items-center py-7 shadow-sm relative px-6"
            >
              <!-- Left Section: Text -->
              <div class="flex-1 justify-start min-w-0 pr-6">
                <div class="text-lg font-bold text-[#4B3A8C]">
                  {{ selectedBook.title }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ selectedBook.author }}
                </div>

                <div class="mt-3 text-sm text-gray-600">
                  {{ selectedBook.description }}
                </div>
                
                <button
                  tonal
                  class="mt-2 bg-[#4B3A8C] text-white text-sm font-medium rounded-full px-3 py-2"
                >
                  Continue Reading
                </button>
              </div>

              <!-- Right Section: Book Cover -->
              <div class="w-40 flex-shrink-0">
                <img
                  class="w-full rounded-2xl shadow-md"
                  :src="selectedBook.cover"
                  alt="Book Cover"
                />
              </div>

              <!-- Close Button -->
              <button
                class="absolute bottom-0 right-4 text-gray-500 hover:text-gray-700"
                @click="closeBookDetail"
              >
                <v-icon icon="mdi-chevron-up" class="text-2xl" />
              </button>
            </div>
          </v-sheet>
        </v-expand-transition>
      </v-sheet>
    </div>
    <!-- Short stories-->
    <div class="py-2">
      <!-- Section Title -->
      <div class="px-3 text-lg font-semibold text-[#4B3A8C] mb-2">
        Popular in Short stories
      </div>
      <v-sheet class="mx-2 bg-transparent">
        <v-slide-group v-model="selectedBookId" show-arrows>
          <v-slide-group-item v-for="book in books" :key="book.id">
            <div
              class="ml-2 flex flex-col items-center relative cursor-pointer"
              @click="selectBook(book)"
            >
              <!-- Book Card Background (Lower Half) -->
              <div
                class="w-[155px] h-[100px] bg-[#F5E9D8] rounded-2xl relative z-0 mt-[90px]"
              ></div>

              <!-- Floating Book Cover with Overlay -->
              <div
                class="absolute transform translate-y-1/7 rounded-xl overflow-hidden shadow-lg w-[120px] h-[155px] z-10"
              >
                <img
                  :src="book.cover"
                  alt="Book Cover"
                  class="w-full h-full object-cover"
                />

                <!-- Overlay for Title & Author -->
                <div
                  class="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/50 to-transparent p-2"
                >
                  <div class="text-white text-xs font-semibold text-center">
                    {{ book.title }}
                  </div>
                  <div class="text-gray-300 text-[10px] text-center">
                    {{ book.author }}
                  </div>
                </div>
              </div>
            </div>
          </v-slide-group-item>
        </v-slide-group>

        <!-- Expandable Book Detail -->
        <v-expand-transition>
          <v-sheet
            v-if="selectedBook"
            class="bg-transparent shadow-lg transition-all duration-500 ease-out opacity-0 translate-y-5"
            :class="{ 'opacity-100 translate-y-0': selectedBook }"
          >
            <div
              class="rounded-3xl bg-[#F5E9D8] flex items-center py-7 shadow-sm relative px-6"
            >
              <!-- Left Section: Text -->
              <div class="flex-1 justify-start min-w-0 pr-6">
                <div class="text-lg font-bold text-[#4B3A8C]">
                  {{ selectedBook.title }}
                </div>
                <div class="text-sm text-gray-600">
                  {{ selectedBook.author }}
                </div>

                <div class="mt-3 text-sm text-gray-600">
                  {{ selectedBook.description }}
                </div>
                
                <button
                  tonal
                  class="mt-2 bg-[#4B3A8C] text-white text-sm font-medium rounded-full px-3 py-2"
                >
                  Continue Reading
                </button>
              </div>

              <!-- Right Section: Book Cover -->
              <div class="w-40 flex-shrink-0">
                <img
                  class="w-full rounded-2xl shadow-md"
                  :src="selectedBook.cover"
                  alt="Book Cover"
                />
              </div>

              <!-- Close Button -->
              <button
                class="absolute bottom-0 right-4 text-gray-500 hover:text-gray-700"
                @click="closeBookDetail"
              >
                <v-icon icon="mdi-chevron-up" class="text-2xl" />
              </button>
            </div>
          </v-sheet>
        </v-expand-transition>
      </v-sheet>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const value = ref(60); // Progress value for the slider
// Sample book data to match the U
// Define book interface
interface Book {
  id: number;
  title: string;
  author: string;
  cover: string;
  description: string;
}

// Define books list
const books = ref<Book[]>([
  {
    id: 1,
    title: "Solar Sinking",
    author: "Keelan Preston",
    cover:
      "https://assets.api.uizard.io/api/cdn/stream/fd72d9ae-da4b-4229-841d-834b368fd3c0.png",
    description:
      "A gripping sci-fi adventure about a dying sun and humanity’s desperate fight for survival.",
  },
  {
    id: 2,
    title: "The Here And Now",
    author: "Jillian Lawrence",
    cover:
      "https://assets.api.uizard.io/api/cdn/stream/fda27036-11a7-4a5f-ab1e-7edbc0c2d0fe.png&quot;",
    description:
      "A thought-provoking novel exploring time, memory, and the choices that shape our destiny.",
  },
  {
    id: 3,
    title: "The Fractured Time",
    author: "Justice Walker",
    cover:
      "https://assets.api.uizard.io/api/cdn/stream/4dc45b48-8b68-463d-b554-7d1f9b3aff01.png&quot;",
    description:
      "A thrilling journey through alternate realities where time itself is breaking apart.",
  },
  {
    id: 4,
    title: "Solar Sinking",
    author: "Keelan Preston",
    cover:
      "https://assets.api.uizard.io/api/cdn/stream/fda27036-11a7-4a5f-ab1e-7edbc0c2d0fe.png&quot;",
    description:
      "A gripping sci-fi adventure about a dying sun and humanity’s desperate fight for survival.",
  },
  {
    id: 5,
    title: "The Here And Now",
    author: "Jillian Lawrence",
    cover:
      "https://assets.api.uizard.io/api/cdn/stream/4dc45b48-8b68-463d-b554-7d1f9b3aff01.png&quot;",
    description:
      "A thought-provoking novel exploring time, memory, and the choices that shape our destiny.",
  },
  {
    id: 6,
    title: "The Fractured Time",
    author: "Justice Walker",
    cover:
      "https://assets.api.uizard.io/api/cdn/stream/fd72d9ae-da4b-4229-841d-834b368fd3c0.png",
    description:
      "A thrilling journey through alternate realities where time itself is breaking apart.",
  },
]);

// Define selected book state
const selectedBookId = ref<number | null>(null);
const selectedBook = ref<Book | null>(null);

// Function to select a book
const selectBook = (book: Book): void => {
  selectedBookId.value = book.id;
  selectedBook.value = book;
};
const closeBookDetail = () => {
  selectedBook.value = null;
};
</script>

<style scoped>
/* Optional: Add custom styles if needed */
.v-range-slider {
  height: 8px !important;
}

/* Optional: Custom styles for the slider arrows */
.v-slide-group__prev,
.v-slide-group__next {
  color: #4b3a8c !important;
}
</style>
