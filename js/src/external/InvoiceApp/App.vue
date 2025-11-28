<script setup lang="ts">
import { ref } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import apiClient from '@/api'
import { appData, isAdmin, MAPPER } from './index'
import Steps from './Steps/index.vue'

const dialogVisible = ref(false)

const { mutate: cancelInvoice, isPending: isCanceling } = useMutation({
	mutationFn: async (orderId: string) =>
		await apiClient.post(`/invoices/cancel/${orderId}`),
	onSuccess: () => {},
	onError: (err) => {
		console.error('作廢電子發票失敗', err)
	},
})

const handleCancel = () => {
	const orderId = appData?.order?.id
	cancelInvoice(orderId)
}
</script>

<template>
	<div class="flex justify-between items-center">
		<el-button
			v-if="isAdmin"
			type="danger"
			@click="handleCancel"
			:loading="isCanceling"
			>作廢發票</el-button
		>
		<el-button type="primary" @click="dialogVisible = true">{{
			MAPPER.ISSUE_INVOICE
		}}</el-button>
	</div>

	<el-dialog
		v-model="dialogVisible"
		:title="MAPPER.ISSUE_INVOICE"
		width="600"
		align-center
		:z-index="999999"
		class="p-8"
	>
		<Steps @close="dialogVisible = false" />
	</el-dialog>
</template>

<style scoped></style>
