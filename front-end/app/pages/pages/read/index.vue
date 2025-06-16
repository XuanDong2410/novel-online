<template>
    <v-footer>
       <v-tabs>
        <v-router-tab>
            <div>
                <component />
            </div>
        </v-router-tab>
       </v-tabs> 
    </v-footer>
    <!-- Toolbar: ẩn/hiện theo showUI -->
    <!-- <v-toolbar v-model="sheetVisible" class="flex items-start justify-start">
      <template v-slot:prepend>
        <NuxtLink
          to="/"
          class="flex items-center text-decoration-none black hover:opacity-80"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </NuxtLink>
      </template>
  
      <v-list-item
        class="flex"
        subtitle="Fitz & The Tantrums"
        title="The Walker The WalkerThe Walker The Walker The Walker The Walker"
        title-lines="1"
        subtitle-lines="1"
      />
  
      <template v-slot:append>
        <v-btn icon="mdi-bookmark-outline"></v-btn>
        <v-btn icon="mdi-earth"></v-btn>
        <v-btn
          icon="mdi-share-variant"
          @click="sheetVisible = !sheetVisible"
        ></v-btn>
      </template>
    </v-toolbar> -->
  
    <!-- Phần nội dung chính, người dùng click để ẩn/hiện -->
    <!-- <div @click="toggleUI" class="flex-grow-1">
      <slot />
    </div> -->
  
    <!-- Bottom sheet: ẩn/hiện theo showUI -->
    <!-- <v-bottom-sheet v-model="sheetVisible" v-if="showUI" inset hide-overlay>
      <v-sheet class="pt-5 rounded-t-lg" elevation="0" color="white">
        <v-list>
          <v-list-item subtitle="Fitz & The Tantrums" title="The Walker">
            <template v-slot:append>
              <div class="d-flex ga-1">
                <v-btn icon="mdi-rewind" variant="text"></v-btn>
                <v-btn icon="mdi-pause" variant="text"></v-btn>
                <v-btn icon="mdi-fast-forward" variant="text"></v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
        <v-progress-linear model-value="50"></v-progress-linear>
        <v-list>
          <div class="d-flex ga-1">
            <v-btn icon="mdi-heart-outline" variant="text"></v-btn>
            <v-btn icon="mdi-comment-processing-outline" variant="text"></v-btn>
            <v-btn icon="mdi-format-list-bulleted" variant="text"></v-btn>
            <v-btn icon="mdi-cog-outline" variant="text"></v-btn>
            <v-btn icon="mdi-arrow-right" variant="text"></v-btn>
          </div>
        </v-list>
      </v-sheet>
    </v-bottom-sheet> -->
  </template>
  
  <script setup>
  import { NuxtLink } from "#components";
  import { ref } from "vue";
  definePageMeta({
    layout: "reading",
  });
  const showUI = ref(true);
  const sheetVisible = ref(true);
  
  function toggleUI() {
    showUI.value = !showUI.value;
  
    // Nếu đang tắt UI thì tắt luôn bottom-sheet
    if (!showUI.value) {
      sheetVisible.value = false;
    } else {
      // Khi mở lại UI thì cũng mở bottom-sheet nếu cần
      sheetVisible.value = true;
    }
  }
  </script>
  