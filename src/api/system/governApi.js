import request from "@/utils/request"

export function page(query) {
    return request({
      url: '/api/v1/config',
      method: 'post',
      data: query
    })
}