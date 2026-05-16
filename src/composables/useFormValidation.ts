import { ref, reactive, computed, watch } from 'vue'
import type { Ref } from 'vue'

// 验证规则类型定义
export interface ValidationRule {
  required?: boolean | string
  minLength?: number | { value: number; message: string }
  maxLength?: number | { value: number; message: string }
  pattern?: RegExp | { value: RegExp; message: string }
  custom?: (value: any) => boolean | string | Promise<boolean | string>
  message?: string
}

// 字段验证状态
export interface FieldValidation {
  isValid: boolean
  errors: string[]
  isDirty: boolean
  isTouched: boolean
}

// 表单验证配置
export interface FormValidationConfig {
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'lazy'
  debounce?: number
  showMessage?: boolean
}

// 预定义验证规则
export const predefinedRules = {
  // 必填验证
  required: (message = '此字段为必填项') => ({
    required: true,
    message
  }),

  // 邮箱验证
  email: (message = '请输入有效的邮箱地址') => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message
  }),

  // 手机号验证
  phone: (message = '请输入有效的手机号码') => ({
    pattern: /^1[3-9]\d{9}$/,
    message
  }),

  // 用户名验证
  username: (message = '用户名只能包含字母、数字和下划线，长度3-20位') => ({
    pattern: /^[a-zA-Z0-9_]{3,20}$/,
    message
  }),

  // 密码强度验证
  password: {
    weak: (message = '密码至少6位') => ({
      minLength: 6,
      message
    }),
    medium: (message = '密码至少8位，包含字母和数字') => ({
      pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
      message
    }),
    strong: (message = '密码至少8位，包含大小写字母、数字和特殊字符') => ({
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
      message
    })
  },

  // 数字范围验证
  numberRange: (min: number, max: number, message?: string) => ({
    custom: (value: number) => {
      if (value < min || value > max) {
        return message || `数值必须在 ${min} 到 ${max} 之间`
      }
      return true
    }
  }),

  // URL验证
  url: (message = '请输入有效的URL地址') => ({
    pattern: /^https?:\/\/.+$/,
    message
  })
}

// 通用表单验证组合式API
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validationRules: Partial<Record<keyof T, ValidationRule | ValidationRule[]>>,
  config: FormValidationConfig = {}
) {
  const {
    mode = 'onChange',
    debounce = 300,
    showMessage = true
  } = config

  // 表单数据
  const formData = reactive({ ...initialData }) as T
  
  // 验证状态
  const fieldValidations = reactive<Record<keyof T, FieldValidation>>({} as Record<keyof T, FieldValidation>)
  
  // 初始化验证状态
  Object.keys(initialData).forEach(key => {
    fieldValidations[key as keyof T] = {
      isValid: true,
      errors: [],
      isDirty: false,
      isTouched: false
    }
  })

  // 整体表单状态
  const isSubmitting = ref(false)
  const submitCount = ref(0)

  // 计算属性
  const isValid = computed(() => {
    return Object.values(fieldValidations).every(validation => validation.isValid)
  })

  const isDirty = computed(() => {
    return Object.values(fieldValidations).some(validation => validation.isDirty)
  })

  const errors = computed(() => {
    const allErrors: string[] = []
    Object.values(fieldValidations).forEach(validation => {
      allErrors.push(...validation.errors)
    })
    return allErrors
  })

  // 验证单个字段
  const validateField = async (fieldName: keyof T): Promise<boolean> => {
    const value = formData[fieldName]
    const rules = validationRules[fieldName]
    const validation = fieldValidations[fieldName]
    
    if (!rules) {
      validation.isValid = true
      validation.errors = []
      return true
    }

    const rulesArray = Array.isArray(rules) ? rules : [rules]
    const fieldErrors: string[] = []

    for (const rule of rulesArray) {
      // 必填验证
      if (rule.required) {
        if (value === null || value === undefined || value === '') {
          const message = typeof rule.required === 'string' ? rule.required : rule.message || '此字段为必填项'
          fieldErrors.push(message)
          continue
        }
      }

      // 长度验证
      if (rule.minLength !== undefined && value !== null && value !== undefined) {
        const minLength = typeof rule.minLength === 'object' ? rule.minLength.value : rule.minLength
        const message = typeof rule.minLength === 'object' ? rule.minLength.message : rule.message || `最少${minLength}个字符`
        
        if (String(value).length < minLength) {
          fieldErrors.push(message)
        }
      }

      if (rule.maxLength !== undefined && value !== null && value !== undefined) {
        const maxLength = typeof rule.maxLength === 'object' ? rule.maxLength.value : rule.maxLength
        const message = typeof rule.maxLength === 'object' ? rule.maxLength.message : rule.message || `最多${maxLength}个字符`
        
        if (String(value).length > maxLength) {
          fieldErrors.push(message)
        }
      }

      // 正则表达式验证
      if (rule.pattern && value !== null && value !== undefined) {
        const pattern = typeof rule.pattern === 'object' ? rule.pattern.value : rule.pattern
        const message = typeof rule.pattern === 'object' ? rule.pattern.message : rule.message || '格式不正确'
        
        if (!pattern.test(String(value))) {
          fieldErrors.push(message)
        }
      }

      // 自定义验证
      if (rule.custom && value !== null && value !== undefined) {
        try {
          const result = await rule.custom(value)
          if (result !== true) {
            const message = typeof result === 'string' ? result : rule.message || '验证失败'
            fieldErrors.push(message)
          }
        } catch (error) {
          const message = rule.message || '验证过程中发生错误'
          fieldErrors.push(message)
        }
      }
    }

    validation.errors = fieldErrors
    validation.isValid = fieldErrors.length === 0
    
    return validation.isValid
  }

  // 验证整个表单
  const validateForm = async (): Promise<boolean> => {
    const validations = await Promise.all(
      Object.keys(formData).map(key => validateField(key as keyof T))
    )
    return validations.every(isValid => isValid)
  }

  // 重置表单
  const resetForm = () => {
    Object.assign(formData, initialData)
    Object.keys(fieldValidations).forEach(key => {
      const validation = fieldValidations[key as keyof T]
      validation.isValid = true
      validation.errors = []
      validation.isDirty = false
      validation.isTouched = false
    })
    isSubmitting.value = false
    submitCount.value = 0
  }

  // 清除验证状态
  const clearValidation = (fieldName?: keyof T) => {
    if (fieldName) {
      const validation = fieldValidations[fieldName]
      if (validation) {
        validation.errors = []
        validation.isValid = true
      }
    } else {
      Object.values(fieldValidations).forEach(validation => {
        validation.errors = []
        validation.isValid = true
      })
    }
  }

  // 字段变更处理
  const handleFieldChange = (fieldName: keyof T) => {
    const validation = fieldValidations[fieldName]
    validation.isDirty = true
    
    if (mode === 'onChange') {
      setTimeout(() => validateField(fieldName), debounce)
    }
  }

  // 字段失焦处理
  const handleFieldBlur = (fieldName: keyof T) => {
    const validation = fieldValidations[fieldName]
    validation.isTouched = true
    
    if (mode === 'onBlur') {
      validateField(fieldName)
    }
  }

  // 表单提交处理
  const handleSubmit = async (
    onSubmit: (data: T) => Promise<any>,
    onError?: (errors: string[]) => void
  ) => {
    isSubmitting.value = true
    submitCount.value++

    try {
      const isValid = await validateForm()
      
      if (!isValid) {
        if (onError) {
          onError(errors.value)
        }
        return false
      }

      await onSubmit({ ...formData })
      return true
    } catch (error) {
      if (onError) {
        onError([error instanceof Error ? error.message : '提交失败'])
      }
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // 监听表单数据变化
  watch(
    formData,
    () => {
      if (mode === 'onChange' && isDirty.value) {
        // 延迟验证以避免过于频繁
        setTimeout(() => {
          Object.keys(formData).forEach(key => {
            if (fieldValidations[key as keyof T]?.isDirty) {
              validateField(key as keyof T)
            }
          })
        }, debounce)
      }
    },
    { deep: true }
  )

  return {
    // 数据
    formData,
    fieldValidations,
    isSubmitting,
    submitCount,
    
    // 状态
    isValid,
    isDirty,
    errors,
    
    // 方法
    validateField,
    validateForm,
    resetForm,
    clearValidation,
    handleFieldChange,
    handleFieldBlur,
    handleSubmit,
    
    // 预定义规则
    rules: predefinedRules
  }
}

// 异步验证组合式API
export function useAsyncValidation<T>() {
  const isChecking = ref(false)
  const checkResults = ref<Record<string, { isValid: boolean; message: string }>>({})
  
  const checkField = async (
    fieldName: string,
    checkFn: () => Promise<{ isValid: boolean; message: string }>
  ) => {
    isChecking.value = true
    try {
      const result = await checkFn()
      checkResults.value[fieldName] = result
      return result.isValid
    } finally {
      isChecking.value = false
    }
  }
  
  const getCheckResult = (fieldName: string) => {
    return checkResults.value[fieldName]
  }
  
  return {
    isChecking,
    checkResults,
    checkField,
    getCheckResult
  }
}