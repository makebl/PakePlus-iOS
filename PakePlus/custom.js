// ==================== 链接跳转处理 ====================

const hookClick = (e) => {
    if (!(e.target instanceof Element)) {
        return
    }
    const origin = e.target.closest('a[href]')
    if (!origin) {
        return
    }
    const baseElement = document.querySelector('head base[target="_blank"]')
    const shouldHandle =
        origin.target === '_blank' ||
        (!origin.target && baseElement)
    if (shouldHandle) {
        e.preventDefault()
        console.log('handle origin:', origin)
        window.location.href = origin.href
    } else {
        console.log('not handle origin:', origin)
    }
}

// ==================== window.open 处理 ====================

const originalWindowOpen = window.open
window.open = function (url, target, features) {
    console.log('open:', url, target, features)
    if (!url) {
        return null
    }
    window.location.href = url
    return null
}

document.addEventListener('click', hookClick, { capture: true })

// ==================== 修复 WKWebView viewport 覆盖问题 ====================
// WebView.swift 会注入一个带 user-scalable=no 的 viewport meta
// 这会覆盖页面自己的 viewport，导致 flex 布局计算错误，部分元素不显示
// 这里移除注入的 viewport，恢复页面原生设置
const removeInjectedViewport = () => {
    const metas = document.querySelectorAll('meta[name="viewport"]')
    metas.forEach((m) => {
        if (m.content && m.content.includes('user-scalable=no')) {
            console.log('remove injected viewport meta:', m.content)
            m.remove()
        }
    })
}

// DOMContentLoaded 时清理
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeInjectedViewport)
} else {
    removeInjectedViewport()
}
// setTimeout 兜底（防止 WebView 在 DOMContentLoaded 之后才注入）
setTimeout(removeInjectedViewport, 100)
setTimeout(removeInjectedViewport, 500)
setTimeout(removeInjectedViewport, 1000)

// ==================== 修复 WKWebView flex 布局问题 ====================
// WKWebView 对 flex 容器的行高计算有偏差，可能导致列表项被挤掉
// 这里注入全局 CSS 修复常见布局问题
const fixStyle = document.createElement('style')
fixStyle.textContent = `
/* 修复 WKWebView flex 布局：避免子元素被截断 */
* {
    -webkit-flex-shrink: 0 !important;
    flex-shrink: 0 !important;
}
/* 邮箱列表常见容器修复 */
[class*="mail"], [class*="list"], [class*="card"], [class*="item"] {
    min-height: 0 !important;
    overflow: visible !important;
}
`
document.head.appendChild(fixStyle)

// ==================== 下拉刷新处理 ====================

let startY = 0
let distance = 0
let isPulling = false
let isRefreshing = false
const refreshThreshold = 80

document.addEventListener('touchstart', (e) => {
    if (isRefreshing) return
    if (window.scrollY !== 0) return
    if (!e.touches || !e.touches.length) return
    startY = e.touches[0].clientY
    distance = 0
    isPulling = true
}, { passive: true })

document.addEventListener('touchmove', (e) => {
    if (!isPulling || isRefreshing) return
    if (!e.touches || !e.touches.length) return
    const currentY = e.touches[0].clientY
    const moveDistance = currentY - startY
    if (moveDistance <= 0) {
        distance = 0
        return
    }
    distance = Math.min(moveDistance, 120)
    e.preventDefault()
    if (distance >= refreshThreshold) {
        console.log('释放手指即可刷新')
    } else {
        console.log('继续下拉')
    }
}, { passive: false })

document.addEventListener('touchend', () => {
    if (!isPulling || isRefreshing) return
    isPulling = false
    if (distance >= refreshThreshold) {
        isRefreshing = true
        console.log('正在刷新页面...')
        window.location.reload()
    } else {
        console.log('下拉距离不足，不刷新')
    }
    distance = 0
}, { passive: true })

document.addEventListener('touchcancel', () => {
    isPulling = false
    distance = 0
}, { passive: true })
