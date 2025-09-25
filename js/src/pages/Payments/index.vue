<script lang="ts" setup>
import {computed} from 'vue'
import Card from '@/components/Card.vue'
import {useQuery} from '@tanstack/vue-query'
import apiClient from '@/api'
import {IGateway} from '@/types'


const {isPending, data,} = useQuery({
  queryKey: ['integrations'],
  queryFn: async () => await apiClient.get('integrations'),
})

const gateways = computed(() => (data?.value?.data ? Object.values(data?.value?.data) : []) as IGateway[])

</script>

<template>
  <div :class="['pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5', {
            'opacity-25': isPending,
          }]">
    <Card v-for="gateway in gateways" :key="gateway.name" v-bind="gateway"/>
  </div>
</template>