import request from '@/utils/request'

// ======================== 调度器全局 ========================

export function getSchedulerInfo() {
  return request({ url: '/api/quartz/jobs/scheduler', method: 'get' })
}

export function pauseAll() {
  return request({ url: '/api/quartz/jobs/scheduler/pause-all', method: 'post' })
}

export function resumeAll() {
  return request({ url: '/api/quartz/jobs/scheduler/resume-all', method: 'post' })
}

export function shutdownScheduler() {
  return request({ url: '/api/quartz/jobs/scheduler/shutdown', method: 'post' })
}

export function startScheduler() {
  return request({ url: '/api/quartz/jobs/scheduler/start', method: 'post' })
}

// ======================== Job 类型 ========================

export function getJobTypes() {
  return request({ url: '/api/quartz/jobs/job-types', method: 'get' })
}

// ======================== Job 列表 ========================

export function getJobList(params) {
  return request({ url: '/api/quartz/jobs', method: 'get', params })
}

// ======================== 单个 Job 操作 ========================

export function createJob(data) {
  return request({ url: '/api/quartz/jobs', method: 'post', data })
}

export function updateJob(jobName, group, data) {
  return request({ url: `/api/quartz/jobs/${jobName}`, method: 'put', params: { group }, data })
}

export function deleteJob(jobName, group = 'BlogJobs') {
  return request({ url: `/api/quartz/jobs/${jobName}`, method: 'delete', params: { group } })
}

export function triggerJobNow(jobName, group = 'BlogJobs') {
  return request({ url: `/api/quartz/jobs/${jobName}/trigger`, method: 'post', params: { group } })
}

export function pauseJob(jobName, group = 'BlogJobs') {
  return request({ url: `/api/quartz/jobs/${jobName}/pause`, method: 'post', params: { group } })
}

export function resumeJob(jobName, group = 'BlogJobs') {
  return request({ url: `/api/quartz/jobs/${jobName}/resume`, method: 'post', params: { group } })
}

export function getJobData(jobName, group = 'BlogJobs') {
  return request({ url: `/api/quartz/jobs/${jobName}/data`, method: 'get', params: { group } })
}

export function getJobLogs(jobName, page = 1, pageSize = 20) {
  return request({ url: `/api/quartz/jobs/${jobName}/logs`, method: 'get', params: { page, pageSize } })
}

// ======================== 批量操作 ========================

export function batchPauseJobs(jobs) {
  return request({ url: '/api/quartz/jobs/batch/pause', method: 'post', data: { jobs } })
}

export function batchResumeJobs(jobs) {
  return request({ url: '/api/quartz/jobs/batch/resume', method: 'post', data: { jobs } })
}

export function batchDeleteJobs(jobs) {
  return request({ url: '/api/quartz/jobs/batch/delete', method: 'post', data: { jobs } })
}

// ======================== 分组操作 ========================

export function pauseGroup(group) {
  return request({ url: `/api/quartz/jobs/group/${group}/pause`, method: 'post' })
}

export function resumeGroup(group) {
  return request({ url: `/api/quartz/jobs/group/${group}/resume`, method: 'post' })
}
