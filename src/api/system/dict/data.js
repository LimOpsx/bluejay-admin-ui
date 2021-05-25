import request from '@/utils/request'

// 查询字典数据列表
export function listData(query) {
  return request({
    url: '/uaa/sys/dict/item/page',
    method: 'post',
    data: query
  })
}

// 查询字典数据详细
export function getData(dictId) {
  return request({
    url: '/uaa/sys/dict/item/' + dictId,
    method: 'get'
  })
}

// 根据字典类型查询字典数据信息
export function getDicts(type) {
  return request({
    url: '/uaa/sys/dict/getList?type=' + type,
    method: 'get'
  })
}

// 新增字典数据
export function addData(data) {
  return request({
    url: '/api/v1/dict/data',
    method: 'post',
    data: data
  })
}

// 修改字典数据
export function updateData(data) {
  return request({
    url: '/api/v1/dict/data/' + data.dictCode,
    method: 'put',
    data: data
  })
}

// 删除字典数据
export function delData(dictCode) {
  return request({
    url: '/api/v1/dict/data/' + dictCode,
    method: 'delete'
  })
}

// 导出字典数据
export function exportData(query) {
  return request({
    url: '/api/v1/dict/data/export',
    method: 'get',
    params: query
  })
}
