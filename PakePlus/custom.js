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
const removeInjectedViewport = () => {
    const metas = document.querySelectorAll('meta[name="viewport"]')
    metas.forEach((m) => {
        if (m.content && m.content.includes('user-scalable=no')) {
            console.log('remove injected viewport meta:', m.content)
            m.remove()
        }
    })
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeInjectedViewport)
} else {
    removeInjectedViewport()
}
setTimeout(removeInjectedViewport, 100)
setTimeout(removeInjectedViewport, 500)
setTimeout(removeInjectedViewport, 1000)

// ==================== 修复 Bootstrap 邮箱列表在 iOS 上少显示问题 ====================
// 原因：邮箱卡片用了 col-md-6/col-md-3，md 断点是 768px，iPhone 宽度 375-414px 不触发
// 导致卡片布局异常，3 个邮箱只显示 2 个
// 修复：强制邮箱卡片内的栅格列在小屏上也按桌面布局显示
const fixStyle = document.createElement('style')
fixStyle.textContent = `
/* 修复 Bootstrap col-md-* 在 iPhone 上不生效的问题 */
/* 强制邮箱卡片的栅格列在小屏上保持桌面布局 */
.mailbox-card .row {
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
}
.mailbox-card .col-md-6,
.mailbox-card .col-md-3,
.mailbox-card .col-md-2,
.mailbox-card .col-md-1,
.mailbox-card .col-md-4 {
    flex: 0 0 auto !important;
    width: auto !important;
    max-width: none !important;
}
/* 邮箱地址列占主要空间 */
.mailbox-card .col-md-6 {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
}
/* 操作按钮列不收缩 */
.mailbox-card .col-md-3,
.mailbox-card .col-md-2 {
    flex: 0 0 auto !important;
}
/* 邮箱卡片本身不收缩，防止被挤掉 */
.mailbox-card {
    flex-shrink: 0 !important;
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
