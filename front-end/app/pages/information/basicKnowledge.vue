<script setup lang="ts">
const categories = [
  {
    title: 'Hướng Dẫn Cơ Bản',
    icon: 'lucide-life-buoy',
    items: [
      'Cài đặt giao diện sáng - tối',
      'Thay đổi màu nền, cỡ chữ, font chữ khi đọc truyện',
      'Kẹo là gì? Sao không còn dùng được?',
      'Khoai là gì? Làm sao để có?',
      'Chia Khoá dùng làm gì? Làm sao để có?',
      'Lọc truyện trên web mất đi đâu rồi?',
      'Mấy bảng xếp hạng theo tuần đâu rồi?',
      'Cái Phiếu màu vàng để làm gì? Hoa đâu mất rồi?',
      'Phần nhiệm vụ mới rồi thì làm sao để tăng level',
      'Làm sao để Đề cử hay Tặng quà?',
      'Vì sao bình luận, đánh giá của tôi bị xoá?',
      'Vì sao tôi bị khoá tài khoản?',
      'Vì sao cùng người khác chửi lộn mà có mỗi tôi bị khoá/phạt?',
      'Tôi vẫn còn thắc mắc?'
    ]
  },
  {
    title: 'Trợ Lực Sáng Tác',
    icon: 'lucide-lightbulb',
    items: [
      'Bạn Cần Chuẩn Bị Những Gì Trước Khi Viết Truyện',
      '10 Bước Viết Đại Cương Cho Người Mới',
      'Đại Cương Mẫu',
      'Cách Viết Phần Mở Đầu Hấp Dẫn',
      'Cách Xây Dựng Nhân Vật',
      'Cách Xây Dựng Thế Giới Quan',
      'Nghệ Thuật Thiết Lập Kim Thủ Chỉ',
      'Bí Quyết Tả Cảnh Chiến Đấu',
      'Tạo Nhân Vật Phản Diện Cùng Cân Kỹ Thuật',
      'Bật Mí Tâm Pháp Nâng Cao Khả Năng Viết Truyện',
      'Một Số Sai Lầm Tác Giả Mới Thường Gặp',
      'Nâng Cao Khả Năng Viết Hội Thoại Giữa Các Nhân Vật',
      '20 Mẹo Bị Truyền Giúp Bạn Viết Mọi Thể Loại Tiểu Thuyết'
    ]
  },
  {
    title: 'Thu nhập và Thanh Toán',
    icon: 'lucide-circle-dollar-sign',
    items: [
      'Đăng truyện ở đây có được tiền không?',
      'Điều kiện xét duyệt Truyện thu phí - Truyện VIP',
      'Phương thức thanh toán',
      'Quy trình thanh toán',
      'Tại sao hoá đơn của tôi vẫn chưa được thanh toán?'
    ]
  },
  {
    title: 'Sử dụng',
    icon: 'lucide-swatch-book',
    items: [
      'Dùng để làm gì?',
      'Viết bản thảo',
      'Soạn đại cương',
      'Quản lý các Truyện của tôi',
      'Danh sách chương',
      'Làm sao để truyện được xuất bản công khai trên nền tảng?',
      'Thêm ảnh minh hoạ cho nội dung truyện',
      'Xem thống kê',
      'Xử lý báo cáo',
      'Yêu cầu hỗ trợ',
      'Quảng cáo truyện của bạn trên nền tảng',
      'Tìm hiểu về Rank của người đăng truyện',
      'Giới hạn người có thể bình luận trong truyện'
    ]
  }
]
</script>

<template>
  <UDashboardPanel id="knowledge">
    <template #header>
      <UCard class="text-center">
        <h1 class="text-2xl font-semibold mb-4">
          Xin chào, bạn cần tìm gì?
        </h1>
        <div class="max-w-xl mx-auto">
          <input
            type="text"
            placeholder="Nhập nội dung tìm kiếm..."
            class="w-full px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
          <div class="text-sm text-gray-400 mt-2">
            Phổ biến: thanh toán, đại cương, tài khoản ...
          </div>
        </div>
      </UCard>
    </template>
    <template #body>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UCard v-for="(category, index) in categories" :key="index" class="bg-white dark:bg-gray-900">
          <template #header>
            <div class="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <UIcon :name="category.icon" class="w-5 h-5 text-red-500 dark:text-red-400" />
              {{ category.title }}
            </div>
          </template>
          <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <li v-for="(item, idx) in category.items" :key="idx" class="flex justify-between items-center hover:underline cursor-pointer">
              {{ item }}
              <UIcon name="lucide-chevron-right" class="w-4 h-4 text-gray-400" />
            </li>
          </ul>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
