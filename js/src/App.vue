<script lang="ts">
export interface IGateway {
  key: string
  name: string
  description?: string
  icon_url?: string
  enabled?: boolean
  domain_type?: 'payments' | 'invoices'
}

enum ETabKey {
  Payment = 'payment',
  Invoice = 'invoice',
  Setting = 'setting'
}
</script>

<script lang="ts" setup>
import {ref, computed} from 'vue'
import type {TabsPaneContext} from 'element-plus'
import Card from '@/components/Card.vue'
import {useQuery} from '@tanstack/vue-query'
import apiClient from '@/api'


const {isPending, isError, data,} = useQuery({
  queryKey: ['todos'],
  queryFn: async () => await apiClient.get('integrations'),
})


const activeName = ref(ETabKey.Payment)

const gateways = computed(() => (data?.value?.data ? Object.values(data?.value?.data) : []) as IGateway[])


const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>


<template>
  <div class="min-h-[40rem]">
    <el-tabs v-model="activeName" :tab-position="'left'" @tab-click="handleClick">
      <el-tab-pane
          v-loading="isPending"
          :name="ETabKey.Payment"
          class="px-8" element-loading-background="rgba(255, 255, 255, 0)" label="金流">
        <div :class="['pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5', {
          'opacity-25': isPending,
        }]">
          <Card v-for="gateway in gateways" v-bind="gateway"/>
        </div>

      </el-tab-pane>
      <el-tab-pane :name="ETabKey.Invoice" label="電子發票">電子發票</el-tab-pane>
      <el-tab-pane :name="ETabKey.Setting" label="設定">Config</el-tab-pane>
    </el-tabs>
  </div>
</template>
