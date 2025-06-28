<script setup lang="ts">
const rewards = [
  {
    icon: 'https://static.cdnno.com/badges/de-nhat-nguyet-phieu.png?1623963912',
    conditions: [
      'Nhận nhiều đề cử (Hoa) nhất trong tháng theo từng website',
      'Danh hiệu có thể nhận nhiều lần'
    ],
    reward: '300,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/de-nhi-nguyet-phieu.png?1623963930',
    conditions: [
      'Nhận nhiều đề cử (Hoa) thứ hai trong tháng theo từng website',
      'Danh hiệu có thể nhận nhiều lần'
    ],
    reward: '200,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/de-nhi-nguyet-phieu.png?1623963930',
    conditions: [
      'Nhận nhiều đề cử (Hoa) thứ ba trong tháng theo từng website',
      'Danh hiệu có thể nhận nhiều lần'
    ],
    reward: '100,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/de-nhi-nguyet-phieu.png?1623963930',
    conditions: [
      'Truyện sáng tác đã vào VIP',
      'Viết đạt 10,000 từ một ngày',
      'Chỉ tính các chương đăng trực tiếp, không tính các chương hẹn giờ',
      '7 ngày gần nhất xuất bản trên 10 chương (chương/tuần)'
    ],
    reward: '100,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/de-nhi-nguyet-phieu.png?1623963930',
    conditions: [
      'Truyện sáng tác đã vào VIP',
      'Viết đạt 20,000 từ một ngày',
      'Chỉ tính các chương đăng trực tiếp, không tính các chương hẹn giờ',
      '7 ngày gần nhất xuất bản trên 10 chương (chương/tuần)'
    ],
    reward: '300,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/don-thien-tam-van-tu.png?1623986168',
    conditions: [
      'Truyện sáng tác đã vào VIP',
      'Viết đạt 30,000 từ một ngày',
      'Chỉ tính các chương đăng trực tiếp, không tính các chương hẹn giờ',
      '7 ngày gần nhất xuất bản trên 10 chương (chương/tuần)'
    ],
    reward: '500,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/thap-thien-lien-tai.png?1624601082',
    conditions: [
      'Truyện sáng tác đã vào VIP',
      'Có chương xuất bản 10 ngày liên tiếp, mỗi ngày ít nhất 4000 chữ'
    ],
    reward: '300,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/thap-thien-lien-tai.png?1624601082',
    conditions: [
      'Truyện sáng tác đã vào VIP',
      'Có chương xuất bản 30 ngày liên tiếp, mỗi ngày ít nhất 4000 chữ'
    ],
    reward: '500,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/nhi-nguyet-lien-tai.png?1624687705',
    conditions: [
      'Truyện sáng tác đã vào VIP',
      'Có chương xuất bản 60 ngày liên tiếp, mỗi ngày ít nhất 4000 chữ'
    ],
    reward: '1,000,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/so-lo-phong-mang.png?1624566813',
    conditions: [
      'Truyện sáng tác đã đăng 100 chương nhưng chưa vào VIP',
      '7 ngày gần nhất xuất bản trên 10 chương (chương / tuần)'
    ],
    reward: '100,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/uom-mam-de-nhat-nhan-khi.png?1646403625',
    conditions: [
      'Truyện sáng tác đạt giải nhất nhân khí cuộc thi Ươm Mầm Tác Việt'
    ],
    reward: '30,000,000 VND'
  },
  {
    icon: 'https://static.cdnno.com/badges/de-nhi-nhan-khi.png?1646403796',
    conditions: [
      'Truyện sáng tác đạt giải nhì nhân khí cuộc thi Ươm Mầm Tác Việt'
    ],
    reward: '20,000,000 VND'
  }
]
</script>

<template>
  <ClientOnly>
    <UDashboardPanel id="award">
      <template #header>
        <UCard class="gap-4 mb-4">
          <ul class="list-disc pl-5 space-y-2 text-sm text-gray-900 dark:text-gray-100">
            <li>Danh Hiệu là hệ thống vinh danh dành cho các truyện đạt được những thành tích nhất định trong web.</li>
            <li>Khi truyện của bạn đạt tới một mốc nào đó thỏa mãn một danh hiệu nào đó trong web thì truyện của bạn sẽ nhận được Danh Hiệu và phần thưởng kèm theo Danh Hiệu.</li>
            <li>Có nhiều loại Danh Hiệu, mỗi Danh Hiệu có điều kiện và phần thưởng khác nhau.</li>
          </ul>
        </UCard>
      </template>

      <template #body>
        <UContainer>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <UCard v-for="(item, index) in rewards" :key="index" class="">
              <template #header>
                <div class="flex items-center justify-center">
                  <img :src="item.icon" alt="icon" class="h-14">
                </div>
              </template>
              <div class="text-sm text-gray-900 dark:text-gray-100 space-y-2">
                <p class="font-bold">
                  Điều kiện:
                </p>
                <ul class="list-disc pl-4 space-y-1">
                  <li v-for="(condition, cIndex) in item.conditions" :key="cIndex">
                    {{ condition }}
                  </li>
                </ul>
                <p><span class="font-bold">Phần thưởng:</span> {{ item.reward }}</p>
              </div>
            </UCard>
          </div>
        </UContainer>
      </template>
    </UDashboardPanel>
  </ClientOnly>
</template>
