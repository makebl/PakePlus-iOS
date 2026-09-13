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
// 只针对邮箱列表项，不影响全局滚动
const fixStyle = document.createElement('style')
fixStyle.textContent = `
/* 只修复 flex 列表项收缩，不影响 body/html 滚动 */
li, [class*="mail-item"], [class*="card-item"], [class*="list-item"] {
    -webkit-flex-shrink: 0 !important;
    flex-shrink: 0 !important;
}
`
document.head.appendChild(fixStyle)

// ==================== 下拉刷新处理 ====================

let startY = 0
let distance = 0
let isPulling = false
let isRefreshing = false
const refreshThreshold = 80

// 使用 capture 阶段 + non-passive 确保 preventDefault 生效
document.addEventListener('touchstart', (e) => {
    if (isRefreshing) return
    if (window.scrollY !== 0) return
    if (!e.touches || !e.touches.length) return
    startY = e.touches[0].clientY
    distance = 0
    isPulling = true
}, { capture: true, passive: false })

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
    e.stopPropagation()
    if (distance >= refreshThreshold) {
        console.log('释放手指即可刷新')
    } else {
        console.log('继续下拉')
    }
}, { capture: true, passive: false })

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
}, { capture: true, passive: false })

document.addEventListener('touchcancel', () => {
    isPulling = false
    distance = 0
}, { capture: true, passive: false })
