<script lang="ts" setup>
import {Back, InfoFilled} from "@element-plus/icons-vue";
import {computed, reactive, toRaw} from 'vue'

const form = reactive<{
  platformId: string,
  merchantId: string,
  apiKey: string,
  clientKey: string,
  mode: string,
  allowPaymentMethodList: string[],
}>({
  platformId: '',
  merchantId: '',
  apiKey: '',
  clientKey: '',
  mode: 'prod',
  allowPaymentMethodList: [
    'CreditCard',
    'VirtualAccount',
    'JKOPay',
    'ApplePay',
    'LinePay',
    'ChaileaseBNPL',
  ],
})

const isTestMode = computed(() => form.mode === 'test')

const onSubmit = () => {
  console.log('submit!', toRaw(form))
}


</script>

<template>
  <div class="flex items-center gap-x-2 mb-4 cursor-pointer" @click="$router.push('/payments')">
    <el-icon>
      <Back/>
    </el-icon>
    回《金流》
  </div>

  <el-form :model="form" label-position="right" label-width="auto" style="max-width: 40rem">
    <el-form-item>
      <template #label>
        <span class="flex gap-x-2 items-center">
          <span>Platform Id</span>
          <el-tooltip content="SLP 平台 ID，平台特店必填，平台特店底下會有子特店" placement="top">
            <el-icon><InfoFilled/></el-icon>
          </el-tooltip>
        </span>
      </template>
      <el-input v-model="form.platformId" :disabled="isTestMode"/>
    </el-form-item>

    <el-form-item :required="!isTestMode">
      <template #label>
        <span class="flex gap-x-2 items-center">
          <span>Merchant Id</span>
          <el-tooltip content="直連特店串接：SLP 分配的特店 ID；平台特店串接：SLP 分配的子特店 ID" placement="top">
            <el-icon><InfoFilled/></el-icon>
          </el-tooltip>
        </span>
      </template>
      <el-input v-model="form.merchantId" :disabled="isTestMode"/>
    </el-form-item>

    <el-form-item :required="!isTestMode" label="Api Key">
      <el-input v-model="form.apiKey" :disabled="isTestMode"/>
    </el-form-item>

    <el-form-item :required="!isTestMode" label="Client Key">
      <el-input v-model="form.clientKey" :disabled="isTestMode"/>
    </el-form-item>


    <el-form-item>
      <template #label>
        <span class="flex gap-x-2 items-center">
          <span>啟用測試模式</span>
          <el-tooltip content="啟用後，將使用測試的串接碼測試付款" placement="top">
            <el-icon><InfoFilled/></el-icon>
          </el-tooltip>
        </span>
      </template>
      <el-switch
          v-model="form.mode"
          active-value="test"
          inactive-value="prod"/>
    </el-form-item>

    <el-form-item label="允許的付款方式">
      <el-checkbox-group v-model="form.allowPaymentMethodList">
        <el-checkbox name="allowPaymentMethodList" value="CreditCard">
          信用卡
        </el-checkbox>
        <el-checkbox name="allowPaymentMethodList" value="VirtualAccount">
          ATM 虛擬帳號
        </el-checkbox>
        <el-checkbox name="allowPaymentMethodList" value="JKOPay">
          街口支付
        </el-checkbox>
        <el-checkbox name="allowPaymentMethodList" value="ApplePay">
          Apple Pay
        </el-checkbox>
        <el-checkbox name="allowPaymentMethodList" value="LinePay">
          Line Pay
        </el-checkbox>
        <el-checkbox name="allowPaymentMethodList" value="ChaileaseBNPL">
          中租
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="onSubmit">儲存</el-button>
      <el-button>Cancel</el-button>
    </el-form-item>
  </el-form>
</template>

<style scoped>

</style>