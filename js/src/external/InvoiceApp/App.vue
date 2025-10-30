<script setup lang="ts">
import { ref } from 'vue'
import { ElMessageBox } from 'element-plus'
import Steps from './Steps/index.vue'

// TODO
const dialogVisible = ref(true)
</script>

<template>
	<el-button type="primary" @click="dialogVisible = true">開立發票</el-button>

	<el-dialog
		v-model="dialogVisible"
		title="開立發票"
		width="600"
		align-center
		:z-index="999999"
		class="p-8"
	>
		<Steps />
	</el-dialog>
</template>

<style scoped></style>
