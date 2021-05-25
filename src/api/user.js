import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/uaa/sys/user/doLogin',
    method: 'post',
    data
  })
}

export function refreshtoken(data) {
  return request({
    url: '/uaa/sys/user/refresh',
    method: 'post',
    data
  })
}

export function getInfo() {
  return request({
    url: '/uaa/sys/user/getUserInfo',
    method: 'post'
  })
}

export function logout() {
  return request({
    url: '/uaa/sys/user/logout',
    method: 'post'
  })
}

