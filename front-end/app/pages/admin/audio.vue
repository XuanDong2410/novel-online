<template>
  <ClientOnly>
    <UDashboardPanel id="novelHome">
      <template #header>
        <UDashboardNavbar
          :ui="{ right: 'gap-3' }"
        >
          <template #leading>
            <UDashboardSidebarCollapse />
            <header class="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
              <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                  <div class="flex items-center space-x-6">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <UIcon name="i-heroicons-book-open" class="w-5 h-5 text-white" />
                      </div>
                      <h1 class="text-xl font-bold">
                        Story Management
                      </h1>
                    </div>
                  </div>
                </div>
              </div>
            </header>
          </template>
          <template #right>
            <div class="flex items-center space-x-4">
              <!-- Stats Pills -->
              <div class="hidden lg:flex items-center space-x-3">
                <div class="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span class="text-sm font-medium text-blue-700 dark:text-blue-300">{{ novels.length }} Stories</span>
                </div>
                <div class="flex items-center space-x-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span class="text-sm font-medium text-emerald-700 dark:text-emerald-300">{{ totalChapters }} Chapters</span>
                </div>
                <div class="flex items-center space-x-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <div class="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <span class="text-sm font-medium text-purple-700 dark:text-purple-300">{{ totalAudios }} Audios</span>
                </div>
              </div>

              <!-- Action Buttons -->
              <UButton
                icon="i-heroicons-cog-8-tooth"
                variant="ghost"
                size="sm"
                class="hidden md:flex"
                @click="showBulkActionsModal = true"
              >
                Bulk Actions
              </UButton>

              <UButton
                icon="i-heroicons-arrow-path"
                title="Refresh"
                variant="ghost"
                size="sm"
                :loading="isRefreshing"
                @click="refreshData(), handleNovelChange()"
              />
            </div>
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <div class="space-y-6 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <!-- Modern Header with Glass Effect -->
          <!-- Audio Statistics Dashboard -->
          <!-- <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              v-for="stat in audioStats"
              :key="stat.key"
              class="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {{ stat.label }}
                  </p>
                  <p class="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                    {{ stat.value }}
                  </p>
                  <div class="flex items-center mt-2">
                    <UIcon
                      :name="stat.trend === 'up' ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'"
                      :class="[
                        'w-4 h-4 mr-1',
                        stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                      ]"
                    />
                    <span
                      :class="[
                        'text-sm font-medium',
                        stat.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      ]"
                    >
                      {{ stat.change }}%
                    </span>
                    <span class="text-sm text-slate-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div
                  :class="[
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    stat.bgColor
                  ]"
                >
                  <UIcon :name="stat.icon" :class="['w-6 h-6', stat.iconColor]" />
                </div>
              </div>

              Progress Bar
              <div class="mt-4">
                <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div
                    :class="[
                      'h-2 rounded-full transition-all duration-500',
                      stat.progressColor
                    ]"
                    :style="{ width: `${stat.progress}%` }"
                  />
                </div>
              </div>
            </div>
          </div> -->
          <div class="my-10">
            <NovelTable
              :role="role"
              :data="data"
              :loading="pending"
              :error="error"
              @update:novels="handleNovelChange"
              @req-publish="handleNovelChange"
            />
          </div>
          <!-- Analytics Overview -->
          <!-- <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <UCard class="lg:col-span-2">
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                    Performance Overview
                  </h3>
                  <USelectMenu
                    v-model="analyticsTimeRange"
                    :options="timeRangeOptions"
                    size="sm"
                  />
                </div>
              </template>

              <div class="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
                <div class="text-center">
                  <UIcon name="i-heroicons-chart-bar" class="w-16 h-16 mx-auto mb-4 text-slate-300" />
                  <p>Analytics chart would be rendered here</p>
                  <p class="text-sm mt-1">
                    Integration with charting library needed
                  </p>
                </div>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                  Quick Stats
                </h3>
              </template>

              <div class="space-y-6">
                <div class="text-center">
                  <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {{ totalViews.toLocaleString() }}
                  </div>
                  <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Total Views
                  </div>
                </div>

                <div class="text-center">
                  <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {{ formatDuration(averageListenTime) }}
                  </div>
                  <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Avg. Listen Time
                  </div>
                </div>

                <div class="text-center">
                  <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {{ completionRate }}%
                  </div>
                  <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Completion Rate
                  </div>
                </div>
              </div>
            </UCard>
          </div> -->
          <!-- Top Performing Content -->
          <!-- <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                  Top Stories
                </h3>
              </template>

              <div class="space-y-4">
                <div
                  v-for="(novel, index) in topNovels"
                  :key="novel._id"
                  class="flex items-center space-x-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold">
                    {{ index + 1 }}
                  </div>
                  <img
                    :src="novel.coverImage || '/placeholder.svg?height=40&width=30'"
                    class="w-10 h-12 object-cover rounded-lg shadow-sm"
                  >
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {{ novel.title }}
                    </p>
                    <p class="text-xs text-slate-500 truncate">
                      {{ novel.author }}
                    </p>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {{ formatNumber(novel.viewCount || 0) }}
                    </div>
                    <div class="text-xs text-slate-500">
                      views
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                  Audio Processing Status
                </h3>
              </template>

              <div class="space-y-4">
                <div
                  v-for="status in audioStatusBreakdown"
                  :key="status.key"
                  class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      :class="[
                        'w-3 h-3 rounded-full',
                        status.color
                      ]"
                    />
                    <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {{ status.label }}
                    </span>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        :class="['h-2 rounded-full transition-all duration-500', status.color]"
                        :style="{ width: `${status.percentage}%` }"
                      />
                    </div>
                    <span class="text-sm font-semibold text-slate-900 dark:text-white min-w-[2rem] text-right">
                      {{ status.count }}
                    </span>
                  </div>
                </div>
              </div>
            </UCard>
          </div> -->
          <!-- Audio Management Table -->
          <!-- <UCard>
            <template #header>
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                    Audio Management
                  </h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manage and monitor all audio files across your stories
                  </p>
                </div>

                <div class="flex items-center space-x-3">
                  <UInput
                    v-model="audioSearchQuery"
                    placeholder="Search audios..."
                    icon="i-heroicons-magnifying-glass"
                    size="sm"
                    class="w-64"
                  />
                  <USelectMenu
                    v-model="selectedAudioStatus"
                    :options="audioStatusOptions"
                    placeholder="Filter by status"
                    size="sm"
                  />
                  <UButton
                    icon="i-heroicons-document-arrow-down"
                    variant="outline"
                    size="sm"
                    @click="exportAudioReport"
                  >
                    Export
                  </UButton>
                </div>
              </div>
            </template>

            <div class="overflow-x-auto">
              <UTable
                :rows="paginatedAudios"
                :columns="audioColumns"
                :loading="loadingAudios"
                class="w-full"
              >
                <template #story-data="{ row }">
                  <div class="flex items-center space-x-3">
                    <img
                      :src="getNovelById(getChapterById(row.chapterId)?.novelId)?.coverImage || '/placeholder.svg?height=40&width=30'"
                      class="w-8 h-10 object-cover rounded-lg shadow-sm"
                    >
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {{ getNovelById(getChapterById(row.chapterId)?.novelId)?.title }}
                      </p>
                      <p class="text-xs text-slate-500 truncate">
                        Chapter {{ getChapterById(row.chapterId)?.chapterNumber }}
                      </p>
                    </div>
                  </div>
                </template>

                <template #audioName-data="{ row }">
                  <div class="flex items-center space-x-3">
                    <div
                      :class="[
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        getAudioStatusBgColor(row.status)
                      ]"
                    >
                      <UIcon
                        :name="getAudioStatusIcon(row.status)"
                        :class="['w-5 h-5', getAudioStatusIconColor(row.status)]"
                      />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {{ row.audioName }}
                      </p>
                      <p class="text-xs text-slate-500 truncate">
                        {{ row.voice.name }} ({{ row.voice.ssmlGender }})
                      </p>
                    </div>
                  </div>
                </template>

                <template #status-data="{ row }">
                  <div class="flex items-center space-x-2">
                    <div
                      :class="[
                        'w-2 h-2 rounded-full',
                        getStatusDotColor(row.status)
                      ]"
                    />
                    <UBadge
                      :label="getAudioStatusLabel(row.status)"
                      :color="getAudioStatusColor(row.status)"
                      variant="soft"
                      size="sm"
                    />
                  </div>
                </template>

                <template #duration-data="{ row }">
                  <div class="text-sm text-slate-600 dark:text-slate-400 font-mono">
                    {{ formatDuration(row.duration) }}
                  </div>
                </template>

                <template #size-data="{ row }">
                  <div class="text-sm text-slate-600 dark:text-slate-400 font-mono">
                    {{ formatFileSize(row.size) }}
                  </div>
                </template>

                <template #actions-data="{ row }">
                  <div class="flex items-center space-x-1">
                    <UButton
                      v-if="row.status === 'processed'"
                      icon="i-heroicons-play"
                      size="xs"
                      variant="ghost"
                      class="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      @click="playAudio(row._id)"
                    />
                    <UButton
                      icon="i-heroicons-eye"
                      size="xs"
                      variant="ghost"
                      class="hover:bg-slate-50 dark:hover:bg-slate-800"
                      @click="openAudioModal(row)"
                    />
                    <UDropdownMenu :items="getAudioActions(row)">
                      <UButton
                        icon="i-heroicons-ellipsis-vertical"
                        size="xs"
                        variant="ghost"
                        class="hover:bg-slate-50 dark:hover:bg-slate-800"
                      />
                    </UDropdownMenu>
                  </div>
                </template>
              </UTable>
            </div>

            Pagination
            <template #footer>
              <div class="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <div class="text-sm text-slate-500 dark:text-slate-400">
                  Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, filteredAudios.length) }} of {{ filteredAudios.length }} results
                </div>
                <UPagination
                  v-model="currentPage"
                  :page-count="pageSize"
                  :total="filteredAudios.length"
                  size="sm"
                />
              </div>
            </template>
          </UCard> -->
        </div>
        <!-- Enhanced Modals -->
        <!-- Novel Detail Modal -->
        <!-- <UModal v-model:open="showNovelModal" fullscreen :class="{ width: 'max-w-5xl' }">
          <template #header>
            <div class="flex items-start justify-between">
              <div class="flex items-start space-x-4">
                <img
                  :src="selectedNovelForModal?.coverImage || '/placeholder.svg?height=120&width=90'"
                  class="w-16 h-20 object-cover rounded-xl shadow-lg"
                >
                <div>
                  <h3 class="text-xl font-bold text-slate-900 dark:text-white">
                    {{ selectedNovelForModal?.title }}
                  </h3>
                  <p class="text-slate-600 dark:text-slate-400 mt-1">
                    by {{ selectedNovelForModal?.author }}
                  </p>
                  <div class="flex items-center space-x-4 mt-2">
                    <UBadge
                  :label="getStatusLabel(selectedNovelForModal.statusPublish)"
                  :color="getStatusColor(selectedNovelForModal.statusPublish)"
                  variant="soft"
                />
                    <span class="text-sm text-slate-500">{{ novelChapters.length }} chapters</span>
                    <span class="text-sm text-slate-500">{{ formatNumber(selectedNovelForModal?.viewCount || 0) }} views</span>
                  </div>
                </div>
              </div>
              <UButton
                icon="i-heroicons-x-mark"
                variant="ghost"
                size="sm"
                @click="showNovelModal = false"
              />
            </div>
          </template>
          <template #body>
            <UCard>
              <div v-if="selectedNovelForModal" class="space-y-6">
                Novel Description
                <div class="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6">
                  <h4 class="font-semibold text-slate-900 dark:text-white mb-3">
                    Description
                  </h4>
                  <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {{ selectedNovelForModal.description }}
                  </p>
                </div>

                Chapters Management
                <div>
                  <div class="flex items-center justify-between mb-6">
                    <h4 class="text-lg font-semibold text-slate-900 dark:text-white">
                      Chapters ({{ novelChapters.length }})
                    </h4>
                    <div class="flex items-center space-x-3">
                      <UInput
                        v-model="modalChapterSearch"
                        placeholder="Search chapters..."
                        icon="i-heroicons-magnifying-glass"
                        size="sm"
                        class="w-64"
                      />
                      <UButton
                        icon="i-heroicons-plus"
                        size="sm"
                        variant="outline"
                      >
                        Add Chapter
                      </UButton>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    <div
                      v-for="chapter in filteredModalChapters"
                      :key="chapter._id"
                      class="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                      @click="openChapterModal(chapter)"
                    >
                      <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                          <div class="flex items-center space-x-2 mb-2">
                            <span class="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                              Chapter {{ chapter.chapterNumber }}
                            </span>
                            <UBadge
                              :label="getStatusLabel(chapter.status as statusPublish)"
                              :color="getStatusColor(chapter.status as statusPublish)"
                              :icon="getStatusIcon(chapter.status as statusPublish)"
                              size="xs"
                              variant="soft"
                            />
                          </div>
                          <h5 class="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {{ chapter.title }}
                          </h5>
                        </div>
                        <UButton
                          icon="i-heroicons-plus"
                          size="xs"
                          variant="ghost"
                          class="opacity-0 group-hover:opacity-100 transition-opacity"
                          @click.stop="addAudioToChapter(chapter)"
                        />
                      </div>

                      <div class="flex items-center justify-between text-xs text-slate-500">
                        <div class="flex items-center space-x-3">
                          <span class="flex items-center space-x-1">
                            <UIcon name="i-heroicons-speaker-wave" class="w-3 h-3" />
                            <span>{{ chapter.audios?.length || 0 }} audios</span>
                          </span>
                          <span class="flex items-center space-x-1">
                            <UIcon name="i-heroicons-eye" class="w-3 h-3" />
                            <span>{{ formatNumber(chapter.viewCount) }}</span>
                          </span>
                        </div>
                        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </template>
        </UModal> -->

        <!-- Add Audio Modal -->
        <UModal v-model:open="showAddAudioModal" :class="{ width: 'max-w-3xl' }">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
                  Add Audio to Chapter {{ selectedChapterForAudio?.chapterNumber }}
                </h3>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {{ selectedChapterForAudio?.title }}
                </p>
              </div>
              <UButton
                icon="i-heroicons-x-mark"
                variant="ghost"
                size="sm"
                @click="showAddAudioModal = false"
              />
            </div>
          </template>
          <template #body>
            <UCard>
              <UForm :state="audioForm" class="space-y-6" @submit="submitAudioForm">
                <!-- Audio Configuration -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UFormField label="Audio Name" required>
                    <UInput
                      v-model="audioForm.audioName"
                      placeholder="Enter audio name..."
                      size="lg"
                    />
                  </UFormField>

                  <UFormField label="Audio Format" required>
                    <USelectMenu
                      v-model="audioForm.audioFileType"
                      :options="audioFileTypeOptions"
                      placeholder="Select format..."
                      size="lg"
                    />
                  </UFormField>
                </div>

                <!-- Voice Selection -->
                <UFormField label="Voice Selection" required>
                <!-- <USelectMenu
                v-model="audioForm.selectedVoice"
                :options="voiceOptions"
                placeholder="Choose voice..."
                option-attribute="label"
                value-attribute="value"
                size="lg"
              >
                <template #item="{ option }">
                  <div class="flex items-center justify-between w-full">
                    <div class="flex items-center space-x-3">
                      <div
                        :class="[
                          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                          option.gender === 'MALE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : option.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        ]"
                      >
                        {{ option.gender === 'MALE' ? 'M' : option.gender === 'FEMALE' ? 'F' : 'N' }}
                      </div>
                      <div>
                        <p class="font-medium">
                          {{ option.name }}
                        </p>
                        <p class="text-xs text-slate-500">
                          {{ option.language }}
                        </p>
                      </div>
                    </div>
                    <UBadge
                      :label="option.gender"
                      :color="option.gender === 'MALE' ? 'blue' : option.gender === 'FEMALE' ? 'pink' : 'gray'"
                      size="xs"
                      variant="soft"
                    />
                  </div>
                </template>
              </USelectMenu> -->
                </UFormField>

                <!-- Processing Options -->
                <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-6">
                  <h4 class="font-medium text-slate-900 dark:text-white mb-4">
                    Processing Options
                  </h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UCheckbox
                      v-model="audioForm.generateSubtitle"
                      label="Auto-generate subtitles (VTT)"
                      class="flex items-center space-x-3"
                    />
                    <UCheckbox
                      v-model="audioForm.enableSync"
                      label="Sync with chapter content"
                      class="flex items-center space-x-3"
                    />
                    <UCheckbox
                      v-model="audioForm.highQuality"
                      label="High quality (slower processing)"
                      class="flex items-center space-x-3"
                    />
                    <UCheckbox
                      v-model="audioForm.enableEnhancement"
                      label="Audio enhancement"
                      class="flex items-center space-x-3"
                    />
                  </div>
                </div>

                <!-- Advanced Settings -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <UFormField label="Speech Speed">
                    <div class="space-y-2">
                      <USlider
                        v-model="audioForm.speed"
                        :min="0.5"
                        :max="2"
                        :step="0.1"
                      />
                      <div class="flex justify-between text-xs text-slate-500">
                        <span>0.5x</span>
                        <span class="font-medium">{{ audioForm.speed }}x</span>
                        <span>2.0x</span>
                      </div>
                    </div>
                  </UFormField>

                  <UFormField label="Volume Level">
                    <div class="space-y-2">
                      <USlider
                        v-model="audioForm.volume"
                        :min="0"
                        :max="100"
                        :step="5"
                      />
                      <div class="flex justify-between text-xs text-slate-500">
                        <span>0%</span>
                        <span class="font-medium">{{ audioForm.volume }}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </UFormField>
                </div>

                <!-- Action Buttons -->
                <div class="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <UButton
                    variant="outline"
                    size="lg"
                    @click="showAddAudioModal = false"
                  >
                    Cancel
                  </UButton>
                  <UButton
                    type="submit"
                    :loading="submittingAudio"
                    icon="i-heroicons-plus"
                    size="lg"
                    class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Create Audio
                  </UButton>
                </div>
              </UForm>
            </UCard>
          </template>
        </UModal>
      </template>
    </UDashboardPanel>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
// import type { TableColumn } from '@nuxt/ui'
import type { statusPublish } from '~/types'

definePageMeta({
  layout: 'admin'
})
// const toast = useToast()
// const { getStatusLabel, getStatusColor, getStatusIcon } = useStatus()

// Types
interface Novel {
  _id: string
  title: string
  author: string
  description: string
  statusPublish: statusPublish
  chapters: { count: number }
  coverImage?: string
  viewCount?: number
}

interface Chapter {
  _id: string
  title: string
  chapterNumber: number
  content: string
  status: string
  viewCount: number
  audios?: string[]
  novelId: string
}

interface Audio {
  _id: string
  audioName: string
  audioFileUrl: string
  audioFileType: string
  duration: number
  size: number
  status: 'pending' | 'processed' | 'error'
  voice: {
    name: string
    ssmlGender: string
    languageCodes: string[]
  }
  subtitle?: {
    url: string
    language: string
    format: string
  } | null
  chapterId: string
}

interface AudioForm {
  audioName: string
  selectedVoice: string | null
  audioFileType: string
  generateSubtitle: boolean
  enableSync: boolean
  highQuality: boolean
  enableEnhancement: boolean
  speed: number
  volume: number
}
const auth = useAuthStore()
const { fetchAllNovelsForAdmin } = useNovels()
const role = computed(() => auth.user?.role)
// Fetch novels based on role

const { data, pending, refresh, error } = await fetchAllNovelsForAdmin()
async function handleNovelChange() {
  await refresh()
}
// Reactive state
const selectedTabIndex = ref<number>(0)
const novels = ref<Novel[]>([])
const chapters = ref<Chapter[]>([])
const audios = ref<Audio[]>([])

// Search and filters
const searchQuery = ref<string>('')
const selectedStatus = ref<string>('')
const selectedAuthor = ref<string>('')
const sortBy = ref<string>('title')
const audioSearchQuery = ref<string>('')
const selectedAudioStatus = ref<string>('')
// const modalChapterSearch = ref<string>('')
const analyticsTimeRange = ref<string>('30d')

// Modal states
// const showNovelModal = ref<boolean>(false)
// const showChapterModal = ref<boolean>(false)
const showAddAudioModal = ref<boolean>(false)
const showBulkActionsModal = ref<boolean>(false)
const showAudioModal = ref<boolean>(false)

// Selected items
// const selectedNovelForModal = ref<Novel>()
// const selectedChapterForModal = ref<Chapter | null>(null)
const selectedChapterForAudio = ref<Chapter | null>(null)
const selectedAudioForModal = ref<Audio | null>(null)

// Loading states
const isRefreshing = ref<boolean>(false)
// const loadingAudios = ref<boolean>(false)
const submittingAudio = ref<boolean>(false)

// Pagination
const currentPage = ref<number>(1)
// const pageSize = ref<number>(10)

// Audio form
const audioForm = ref<AudioForm>({
  audioName: '',
  selectedVoice: null,
  audioFileType: 'MP3',
  generateSubtitle: true,
  enableSync: true,
  highQuality: false,
  enableEnhancement: false,
  speed: 1.0,
  volume: 80
})

// Audio player refs
const audioRefs = ref<Record<string, HTMLAudioElement>>({})
// const currentSubtitle = ref<Record<string, string>>({})
// const subtitleData = ref<Record<string, any[]>>({})

// const statusOptions = [
//   { label: 'All Status', value: '' },
//   { label: 'Draft', value: 'draft' },
//   { label: 'Pending', value: 'pending' },
//   { label: 'Editing', value: 'editing' },
//   { label: 'Warning', value: 'warning' },
//   { label: 'Approved', value: 'approved' },
//   { label: 'Rejected', value: 'rejected' }
// ]

// const sortOptions = [
//   { label: 'Title A-Z', value: 'title' },
//   { label: 'Author A-Z', value: 'author' },
//   { label: 'Most Viewed', value: 'views' },
//   { label: 'Recently Updated', value: 'updated' },
//   { label: 'Chapter Count', value: 'chapters' }
// ]

// const audioStatusOptions = [
//   { label: 'All Status', value: '' },
//   { label: 'Processing', value: 'pending' },
//   { label: 'Completed', value: 'processed' },
//   { label: 'Error', value: 'error' }
// ]

const audioFileTypeOptions = [
  { label: 'MP3 (Recommended)', value: 'MP3' },
  { label: 'WAV (High Quality)', value: 'WAV' },
  { label: 'OGG (Web Optimized)', value: 'OGG' }
]

const voiceOptions = [
  {
    label: 'Minh Đức (Male, Deep)',
    value: 'minh-duc',
    name: 'Minh Đức',
    gender: 'MALE',
    language: 'Vietnamese'
  },
  {
    label: 'Thu Hà (Female, Sweet)',
    value: 'thu-ha',
    name: 'Thu Hà',
    gender: 'FEMALE',
    language: 'Vietnamese'
  },
  {
    label: 'Hoàng Nam (Neutral, Clear)',
    value: 'hoang-nam',
    name: 'Hoàng Nam',
    gender: 'NEUTRAL',
    language: 'Vietnamese'
  }
]

const timeRangeOptions = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last year', value: '1y' }
]

// const audioColumns: TableColumn<Audio>[] = [
//   { id: 'story', label: 'Story/Chapter' },
//   { id: 'audioName', label: 'Audio Name' },
//   { id: 'status', label: 'Status' },
//   { id: 'duration', label: 'Duration' },
//   { id: 'size', label: 'Size' },
//   { id: 'actions', label: 'Actions' }
// ]

// Mock data
const mockNovels: Novel[] = [
  {
    _id: '1',
    title: 'The Legendary Sword Master',
    author: 'Nguyen Van A',
    description: 'An epic tale of a young warrior\'s journey from a small village to becoming the greatest sword master in the realm. Through countless trials and tribulations, he discovers the true meaning of strength and honor.',
    statusPublish: 'approved' as statusPublish,
    chapters: { count: 150 },
    coverImage: '/placeholder.svg?height=320&width=240',
    viewCount: 154200
  },
  {
    _id: '2',
    title: 'Magical World Chronicles',
    author: 'Tran Thi B',
    description: 'Adventure in a world full of magic and mystical creatures, where power is determined by one\'s ability to harness the arcane forces that flow through all living things.',
    statusPublish: 'pending' as statusPublish,
    chapters: { count: 89 },
    coverImage: '/placeholder.svg?height=320&width=240',
    viewCount: 89300
  },
  {
    _id: '3',
    title: 'Journey of Discovery',
    author: 'Le Van C',
    description: 'A thrilling adventure story filled with exciting discoveries in a vast and mysterious world where ancient secrets await those brave enough to seek them.',
    statusPublish: 'approved' as statusPublish,
    chapters: { count: 45 },
    coverImage: '/placeholder.svg?height=320&width=240',
    viewCount: 56700
  }
]

const mockChapters: Chapter[] = [
  {
    _id: 'ch1',
    title: 'The Beginning of the Journey',
    chapterNumber: 1,
    content: 'In a small village nestled at the foot of the mountains, there lived a young man named Minh. From childhood, Minh had dreamed of becoming a powerful warrior...',
    status: 'approved',
    viewCount: 12500,
    audios: ['audio1', 'audio2'],
    novelId: '1'
  },
  {
    _id: 'ch2',
    title: 'Meeting the Master',
    chapterNumber: 2,
    content: 'After leaving the village, Minh encountered a hermit master living deep in the forest. This master would become Minh\'s mentor...',
    status: 'approved',
    viewCount: 9800,
    audios: ['audio3'],
    novelId: '1'
  },
  {
    _id: 'ch3',
    title: 'The First Lesson',
    chapterNumber: 3,
    content: 'The master began teaching Minh the fundamental lessons of martial arts and life philosophy...',
    status: 'pending',
    viewCount: 7500,
    audios: [],
    novelId: '1'
  }
]

const mockAudios: Audio[] = [
  {
    _id: 'audio1',
    audioName: 'Chapter 1 - Male Deep Voice',
    audioFileUrl: '/placeholder.mp3',
    audioFileType: 'MP3',
    duration: 1800,
    size: 25600000,
    status: 'processed',
    voice: {
      name: 'Minh Đức',
      ssmlGender: 'MALE',
      languageCodes: ['vi-VN']
    },
    subtitle: {
      url: '/placeholder.vtt',
      language: 'vi-VN',
      format: 'VTT'
    },
    chapterId: 'ch1'
  },
  {
    _id: 'audio2',
    audioName: 'Chapter 1 - Female Sweet Voice',
    audioFileUrl: '/placeholder2.mp3',
    audioFileType: 'MP3',
    duration: 1750,
    size: 24800000,
    status: 'processed',
    voice: {
      name: 'Thu Hà',
      ssmlGender: 'FEMALE',
      languageCodes: ['vi-VN']
    },
    subtitle: {
      url: '/placeholder2.vtt',
      language: 'vi-VN',
      format: 'VTT'
    },
    chapterId: 'ch1'
  },
  {
    _id: 'audio3',
    audioName: 'Chapter 2 - Male Deep Voice',
    audioFileUrl: '/placeholder3.mp3',
    audioFileType: 'MP3',
    duration: 0,
    size: 0,
    status: 'pending',
    voice: {
      name: 'Minh Đức',
      ssmlGender: 'MALE',
      languageCodes: ['vi-VN']
    },
    subtitle: null,
    chapterId: 'ch2'
  },
  {
    _id: 'audio4',
    audioName: 'Chapter 2 - Female Voice (Error)',
    audioFileUrl: '',
    audioFileType: 'MP3',
    duration: 0,
    size: 0,
    status: 'error',
    voice: {
      name: 'Thu Hà',
      ssmlGender: 'FEMALE',
      languageCodes: ['vi-VN']
    },
    subtitle: null,
    chapterId: 'ch2'
  }
]

// Computed properties
// const breadcrumbLinks = computed(() => {
//   const links = [{ label: 'Dashboard', to: '/' }]
//   const tab = mainTabs[selectedTabIndex.value]?.slot
//   if (tab === 'stories') {
//     links.push({ label: 'Story Management', to: '' })
//   } else if (tab === 'audios') {
//     links.push({ label: 'Audio Management' })
//   } else if (tab === 'analytics') {
//     links.push({ label: 'Analytics' })
//   }
//   return links
// })

// const authorOptions = computed(() => {
//   const authors = [...new Set(novels.value.map(novel => novel.author))]
//   return [
//     { label: 'All Authors', value: '' },
//     ...authors.map(author => ({ label: author, value: author }))
//   ]
// })

// const filteredNovels = computed(() => {
//   let filtered = [...novels.value]

//   // Search filter
//   if (searchQuery.value) {
//     const query = searchQuery.value.toLowerCase()
//     filtered = filtered.filter(novel =>
//       novel.title.toLowerCase().includes(query)
//       || novel.author.toLowerCase().includes(query)
//       || novel.description.toLowerCase().includes(query)
//     )
//   }

//   // Status filter
//   if (selectedStatus.value) {
//     filtered = filtered.filter(novel => novel.statusPublish === selectedStatus.value)
//   }

//   // Author filter
//   if (selectedAuthor.value) {
//     filtered = filtered.filter(novel => novel.author === selectedAuthor.value)
//   }

//   // Sorting
//   filtered.sort((a, b) => {
//     switch (sortBy.value) {
//       case 'title':
//         return a.title.localeCompare(b.title)
//       case 'author':
//         return a.author.localeCompare(b.author)
//       case 'views':
//         return (b.viewCount || 0) - (a.viewCount || 0)
//       case 'chapters':
//         return b.chapters.count - a.chapters.count
//       default:
//         return 0
//     }
//   })

//   return filtered
// })

// const filteredAudios = computed(() => {
//   let filtered = [...audios.value]

//   if (audioSearchQuery.value) {
//     const query = audioSearchQuery.value.toLowerCase()
//     filtered = filtered.filter(audio =>
//       audio.audioName.toLowerCase().includes(query)
//     )
//   }

//   if (selectedAudioStatus.value) {
//     filtered = filtered.filter(audio => audio.status === selectedAudioStatus.value)
//   }

//   return filtered
// })

// const paginatedAudios = computed(() => {
//   const start = (currentPage.value - 1) * pageSize.value
//   const end = start + pageSize.value
//   return filteredAudios.value.slice(start, end)
// })

// const novelChapters = computed(() => {
//   if (!selectedNovelForModal.value) return []
//   return chapters.value
//     .filter(chapter => chapter.novelId === selectedNovelForModal.value!._id)
//     .sort((a, b) => a.chapterNumber - b.chapterNumber)
// })

// const filteredModalChapters = computed(() => {
//   if (!modalChapterSearch.value) return novelChapters.value
//   const query = modalChapterSearch.value.toLowerCase()
//   return novelChapters.value.filter(chapter =>
//     chapter.title.toLowerCase().includes(query)
//     || chapter.chapterNumber.toString().includes(query)
//   )
// })

// Statistics
const totalChapters = computed(() => chapters.value.length)
const totalAudios = computed(() => audios.value.length)
const processedAudios = computed(() => audios.value.filter(audio => audio.status === 'processed').length)
const pendingAudios = computed(() => audios.value.filter(audio => audio.status === 'pending').length)
const errorAudios = computed(() => audios.value.filter(audio => audio.status === 'error').length)

const totalViews = computed(() => novels.value.reduce((sum, novel) => sum + (novel.viewCount || 0), 0))
const averageListenTime = computed(() => 1200) // Mock data
const completionRate = computed(() => Math.round((processedAudios.value / totalAudios.value) * 100) || 0)

// const topNovels = computed(() => {
//   return [...novels.value]
//     .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
//     .slice(0, 10)
// })

const audioStats = computed(() => [
  {
    key: 'total',
    label: 'Total Audios',
    value: totalAudios.value,
    icon: 'i-heroicons-speaker-wave',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600',
    progressColor: 'bg-blue-500',
    progress: 100,
    trend: 'up',
    change: 12
  },
  {
    key: 'processed',
    label: 'Processed',
    value: processedAudios.value,
    icon: 'i-heroicons-check-circle',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600',
    progressColor: 'bg-emerald-500',
    progress: (processedAudios.value / totalAudios.value) * 100,
    trend: 'up',
    change: 8
  },
  {
    key: 'pending',
    label: 'Processing',
    value: pendingAudios.value,
    icon: 'i-heroicons-clock',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    iconColor: 'text-yellow-600',
    progressColor: 'bg-yellow-500',
    progress: (pendingAudios.value / totalAudios.value) * 100,
    trend: 'down',
    change: 5
  },
  {
    key: 'error',
    label: 'Errors',
    value: errorAudios.value,
    icon: 'i-heroicons-exclamation-triangle',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600',
    progressColor: 'bg-red-500',
    progress: (errorAudios.value / totalAudios.value) * 100,
    trend: 'down',
    change: 15
  }
])

// const audioStatusBreakdown = computed(() => [
//   {
//     key: 'processed',
//     label: 'Processed',
//     count: processedAudios.value,
//     percentage: (processedAudios.value / totalAudios.value) * 100,
//     color: 'bg-emerald-500'
//   },
//   {
//     key: 'pending',
//     label: 'Processing',
//     count: pendingAudios.value,
//     percentage: (pendingAudios.value / totalAudios.value) * 100,
//     color: 'bg-yellow-500'
//   },
//   {
//     key: 'error',
//     label: 'Error',
//     count: errorAudios.value,
//     percentage: (errorAudios.value / totalAudios.value) * 100,
//     color: 'bg-red-500'
//   }
// ])

// Tab configuration
const mainTabs = computed(() => [
  {
    slot: 'stories',
    label: 'Stories',
    icon: 'i-heroicons-book-open',
    badge: novels.value.length.toString()
  },
  {
    slot: 'audios',
    label: 'Audio Management',
    icon: 'i-heroicons-speaker-wave',
    badge: totalAudios.value.toString()
  },
  {
    slot: 'analytics',
    label: 'Analytics',
    icon: 'i-heroicons-chart-bar-square'
  }
])

// Methods
const refreshData = async (): Promise<void> => {
  isRefreshing.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
  } finally {
    isRefreshing.value = false
  }
}

// const resetFilters = (): void => {
//   searchQuery.value = ''
//   selectedStatus.value = ''
//   selectedAuthor.value = ''
//   sortBy.value = 'title'
//   audioSearchQuery.value = ''
//   selectedAudioStatus.value = ''
//   currentPage.value = 1
// }

// const openNovelModal = (novel: Novel): void => {
//   selectedNovelForModal.value = novel
//   modalChapterSearch.value = ''
//   showNovelModal.value = true
// }

// const openChapterModal = (chapter: Chapter): void => {
//   selectedChapterForModal.value = chapter
//   showChapterModal.value = true
// }

const openAudioModal = (audio: Audio): void => {
  selectedAudioForModal.value = audio
  showAudioModal.value = true
}

// const addAudioToChapter = (chapter: Chapter): void => {
//   selectedChapterForAudio.value = chapter
//   audioForm.value = {
//     audioName: `${chapter.title} - New Audio`,
//     selectedVoice: null,
//     audioFileType: 'MP3',
//     generateSubtitle: true,
//     enableSync: true,
//     highQuality: false,
//     enableEnhancement: false,
//     speed: 1.0,
//     volume: 80
//   }
//   showAddAudioModal.value = true
// }

const submitAudioForm = async (): Promise<void> => {
  submittingAudio.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    const newAudio: Audio = {
      _id: `audio_${Date.now()}`,
      audioName: audioForm.value.audioName,
      audioFileUrl: '',
      audioFileType: audioForm.value.audioFileType,
      duration: 0,
      size: 0,
      status: 'pending',
      voice: (() => {
        const selected = voiceOptions.find(v => v.value === audioForm.value.selectedVoice) || voiceOptions[0]
        return {
          name: selected?.name ?? '',
          ssmlGender: selected?.gender ?? '',
          languageCodes: [selected?.language === 'Vietnamese' ? 'vi-VN' : 'en-US']
        }
      })(),
      subtitle: audioForm.value.generateSubtitle
        ? {
            url: '',
            language: 'vi-VN',
            format: 'VTT'
          }
        : null,
      chapterId: selectedChapterForAudio.value!._id
    }
    audios.value.push(newAudio)
    showAddAudioModal.value = false
  } catch (error) {
    console.error('Failed to add audio:', error)
  } finally {
    submittingAudio.value = false
  }
}

// const exportAudioReport = (): void => {
//   console.log('Exporting audio report...')
// }

// const getNovelById = (novelId: string): Novel | undefined => {
//   return novels.value.find(novel => novel._id === novelId)
// }

// const getChapterById = (chapterId: string): Chapter | undefined => {
//   return chapters.value.find(chapter => chapter._id === chapterId)
// }

// const getNovelActions = (novel: Novel) => {
//   return [
//     [{
//       label: 'View Details',
//       icon: 'i-heroicons-eye',
//       click: () => openNovelModal(novel)
//     }],
//     [{
//       label: 'View Analytics',
//       icon: 'i-heroicons-chart-bar',
//       click: () => viewNovelStats(novel)
//     }],
//     [{
//       label: 'Export Report',
//       icon: 'i-heroicons-document-arrow-down',
//       click: () => exportNovelReport(novel)
//     }]
//   ]
// }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAudioActions = (audio: Audio) => {
  const actions = []
  if (audio.status === 'processed') {
    actions.push([{
      label: 'Play Audio',
      icon: 'i-heroicons-play',
      click: () => playAudio(audio._id)
    }])
    actions.push([{
      label: 'Download',
      icon: 'i-heroicons-arrow-down-tray',
      click: () => downloadAudio(audio.audioFileUrl, audio.audioName)
    }])
  }
  if (audio.status === 'error') {
    actions.push([{
      label: 'Retry',
      icon: 'i-heroicons-arrow-path',
      click: () => retryAudioProcessing(audio._id)
    }])
  }
  actions.push([{
    label: 'View Details',
    icon: 'i-heroicons-eye',
    click: () => openAudioModal(audio)
  }])
  actions.push([{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    click: () => deleteAudio(audio._id)
  }])
  return actions
}

const playAudio = (audioId: string): void => {
  const audioElement = audioRefs.value[audioId]
  if (audioElement) {
    audioElement.play()
  }
}

const downloadAudio = (url: string, filename: string): void => {
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.mp3`
  link.click()
}

const retryAudioProcessing = async (audioId: string): Promise<void> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const audio = audios.value.find(a => a._id === audioId)
    if (audio) {
      audio.status = 'pending'
    }
  } catch (error) {
    console.error('Failed to retry audio processing:', error)
  }
}

const deleteAudio = async (audioId: string): Promise<void> => {
  if (confirm('Are you sure you want to delete this audio?')) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      const index = audios.value.findIndex(a => a._id === audioId)
      if (index > -1) {
        audios.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Failed to delete audio:', error)
    }
  }
}

// const viewNovelStats = (novel: Novel): void => {
//   console.log('View stats for:', novel.title)
// }

// const exportNovelReport = (novel: Novel): void => {
//   console.log('Export report for:', novel.title)
// }

// Utility functions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getStatusDotColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    draft: 'bg-gray-400',
    pending: 'bg-yellow-400',
    editing: 'bg-blue-400',
    warning: 'bg-orange-400',
    approved: 'bg-green-400',
    rejected: 'bg-red-400',
    ongoing: 'bg-blue-400',
    completed: 'bg-green-400',
    hiatus: 'bg-orange-400',
    processed: 'bg-green-400',
    error: 'bg-red-400'
  }
  return colorMap[status] || 'bg-gray-400'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAudioStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Processing',
    processed: 'Completed',
    error: 'Error'
  }
  return statusMap[status] || status
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAudioStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'yellow',
    processed: 'green',
    error: 'red'
  }
  return colorMap[status] || 'gray'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAudioStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    pending: 'i-heroicons-clock',
    processed: 'i-heroicons-check-circle',
    error: 'i-heroicons-exclamation-triangle'
  }
  return iconMap[status] || 'i-heroicons-speaker-wave'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAudioStatusBgColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30',
    processed: 'bg-green-100 dark:bg-green-900/30',
    error: 'bg-red-100 dark:bg-red-900/30'
  }
  return colorMap[status] || 'bg-gray-100 dark:bg-gray-800'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getAudioStatusIconColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: 'text-yellow-600',
    processed: 'text-green-600',
    error: 'text-red-600'
  }
  return colorMap[status] || 'text-gray-600'
}

const formatDuration = (seconds: number): string => {
  if (!seconds) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatFileSize = (bytes: number): string => {
  if (!bytes) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

// const formatNumber = (num: number): string => {
//   if (num >= 1000000) {
//     return (num / 1000000).toFixed(1) + 'M'
//   } else if (num >= 1000) {
//     return (num / 1000).toFixed(1) + 'K'
//   }
//   return num.toString()
// }

// Lifecycle
onMounted(() => {
  novels.value = mockNovels
  chapters.value = mockChapters
  audios.value = mockAudios
})

// Watch for tab changes
watch(selectedTabIndex, (newIndex) => {
  const tab = mainTabs.value[newIndex]?.slot
  if (tab === 'stories') {
    searchQuery.value = ''
    selectedStatus.value = ''
    selectedAuthor.value = ''
    sortBy.value = 'title'
  } else if (tab === 'audios') {
    audioSearchQuery.value = ''
    selectedAudioStatus.value = ''
    currentPage.value = 1
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-4 {
  display: -webkit-box;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}

* {
  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.backdrop-blur-xl {
  backdrop-filter: blur(24px);
}

.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

.group:hover .group-hover\:scale-105 {
  transform: scale(1.05);
}

.group:hover .group-hover\:opacity-100 {
  opacity: 1;
}

.group:hover .group-hover\:translate-y-0 {
  transform: translateY(0);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.focus\:ring-2:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}
</style>
