import request from '@/utils/request'

export function page(query) {
  return request({
    url: '/uaa/sys/admin/token/page',
    method: 'post',
    data: query
  })
}
