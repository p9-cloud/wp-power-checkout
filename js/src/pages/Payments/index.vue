<script lang="ts" setup>
import {computed, toRaw, watch} from 'vue'
import Card from '@/components/Card.vue'
import {useQuery} from '@tanstack/vue-query'
import apiClient from '@/api'
import {IGateway} from '@/types'


const {isPending, data, isSuccess} = useQuery({
  queryKey: ['gateways',],
  queryFn: async () => await apiClient.get('gateways'),
  select: (response) => {
    return response.data || response
  }
})


const gateways = computed(() => Object.values(data?.value || {}) as IGateway[])

</script>

<template>
  <div :class="['pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5', {
            'opacity-25': isPending,
          }]">
    <Card v-for="gateway in gateways" :key="gateway.id" v-bind="gateway"/>
  </div>
</template>