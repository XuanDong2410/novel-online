<template>
  <v-app class="flex justify-center">
    <v-card
      variant="outlined"
      class="pa-6 mt-3 mx-auto w-full "
      elevation="3"
      max-width="400"
      rounded="xl"
    >
      <!-- Avatar + Tên -->
      <div class="text-center mb-4 flex items-start text-[#4B3A8C]">
        <v-avatar size="80" class="mx-3 mb-2">
          <v-img src="https://randomuser.me/api/portraits/men/35.jpg" />
        </v-avatar>
        <div class="mx-auto">
          <h2 class="text-xl font-bold ">Boris Filan</h2>
          <div class="flex justify-center gap-4 mt-2 text-sm ">
            <div><span class="font-semibold">700</span><br />Books</div>
            <div><span class="font-semibold">3,000</span><br />Friends</div>
            <div><span class="font-semibold">7</span><br />Following</div>
          </div>
        </div>
      </div>

      <v-divider class="my-3" />

      <!-- Info Items -->
      <v-list density="compact">
        <v-list-item>
          <v-icon start>mdi-information</v-icon>
          <v-list-item-title>Male, Bratislava/Kosice</v-list-item-title>
        </v-list-item>

        <v-list-item>
          <v-icon start>mdi-cake</v-icon>
          <v-list-item-title>October 23</v-list-item-title>
        </v-list-item>

        <v-list-item>
          <v-icon start>mdi-calendar</v-icon>
          <v-list-item-title>Joined in December 2009</v-list-item-title>
        </v-list-item>

        <v-list-item>
          <v-icon start>mdi-bookshelf</v-icon>
          <v-list-item-title
            >Crime and Mystery, Short stories, + 5 more</v-list-item-title
          >
        </v-list-item>
      </v-list>

      <!-- Progress Bar -->
      <div class="mt-4">
        <div class="flex justify-between items-center text-sm font-medium mb-1">
          <div class="flex items-center gap-2">
            <v-icon size="18">mdi-target</v-icon>
            2022 Books
          </div>
          <span>7/20</span>
        </div>
        <v-progress-linear
          :model-value="35"
          height="10"
          color="#4B3A8C"
          bg-color="#E5E5E5"
          rounded
        />
      </div>
    </v-card>
  </v-app>
</template>
