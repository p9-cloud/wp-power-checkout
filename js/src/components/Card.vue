<script lang="ts" setup>
import {ref} from 'vue'
import {Setting} from "@element-plus/icons-vue";
import {useMutation, useQueryClient} from '@tanstack/vue-query'
import {IGateway} from '@/types';
import apiClient from '@/api'

const props = withDefaults(defineProps<IGateway>(), {
  description: '',
  icon_url: '',
  enabled: false
})

const enabled = ref<boolean>(props.enabled)

const queryClient = useQueryClient()

const {mutateAsync: toggleIntegration, isPending} = useMutation({
  mutationFn: async () => {
    return apiClient.post('toggle-integration', {integration_key: props.integration_key})
  },
  onSuccess() {
    queryClient.invalidateQueries({queryKey: ['integrations']})
  },
})

// 當 switch 改變時觸發 mutation
const handleChange: () => Promise<boolean> = async () => {
  try {
    await toggleIntegration();
    return true;// 成功 → 允許切換
  } catch (e) {
    return false;// 失敗 → 阻止切換
  }
}

</script>


<template>
  <el-card class="rounded-lg max-w-[30rem]" footer-class="py-2" shadow="hover">

    <div class="flex items-center gap-x-4 mb-4">

      <div class="size-12 rounded-xl flex items-center justify-center bg-gray-200">
        <img v-if="icon_url" :alt="name" :src="icon_url" class="size-7 object-contain"/>
      </div>

      <div class="flex-1">
        <h5 class="text-gray-900 font-semibold text-xl m-0 leading-5">{{ name }}</h5>
      </div>
    </div>

    <p class="text-gray-600 text-base">{{ description || `使用 ${name} 收款` }}</p>

    <template #footer>

      <div class="flex justify-between items-center">
        <div class="flex items-center gap-x-2">
          <el-switch
              v-model="enabled"
              :before-change="handleChange"
              :loading="isPending"
              size="small"
          />
          <span>{{ enabled ? 'Enabled' : 'Disabled' }}</span>
        </div>
        <div>
          <RouterLink :to="`/payments/${props.setting_key}`">
            <Setting v-if="enabled" class="text-gray-400 size-5 cursor-pointer"/>
          </RouterLink>
        </div>
      </div>

    </template>
  </el-card>
</template>
