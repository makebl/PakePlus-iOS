// ==================== 禁用双指缩放 ====================

const injectViewport = () => {
    const existing = document.querySelector('meta[name="viewport"]')
    if (existing) existing.remove()
    const meta = document.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no'
    if (document.head) {
        document.head.appendChild(meta)
    } else if (document.documentElement) {
        document.documentElement.appendChild(meta)
    }
}

injectViewport()

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectViewport)
} else {
    injectViewport()
}


// ==================== 链接跳转处理 ====================

const hookClick = (e) => {
    if (!(e.target instanceof Element)) return
    const origin = e.target.closest('a[href]')
    if (!origin) return
    const baseElement = document.querySelector('head base[target="_blank"]')
    const shouldHandle = origin.target === '_blank' || (!origin.target && baseElement)
    if (shouldHandle) {
        e.preventDefault()
        window.location.href = origin.href
    }
}


// ==================== window.open 处理 ====================

const originalWindowOpen = window.open

window.open = function (url, target, features) {
    if (!url) return null
    window.location.href = url
    return null
}

document.addEventListener('click', hookClick, { capture: true })


// ==================== 下拉刷新处理（只在页面顶部触发） ====================

let startY = 0
let distance = 0
let isPulling = false
let isRefreshing = false
const refreshThreshold = 80

// 用 flag 追踪滚动状态（解决 WKWebView window.scrollY 不更新的问题）
let isAtTop = true
let internalScrollTops = new Map()  // 记录各滚动容器的 scrollTop

// 检查是否所有滚动位置都在顶部
const checkAllAtTop = () => {
    // 检查 window/document 整体滚动
    const winScroll = window.scrollY || window.pageYOffset || 0
    const docScroll = document.documentElement.scrollTop || 0
    const bodyScroll = document.body.scrollTop || 0

    if (winScroll > 0 || docScroll > 0 || bodyScroll > 0) {
        return false
    }

    // 检查 visualViewport（WKWebView 可能用这个）
    if (window.visualViewport && window.visualViewport.pageTop > 0) {
        return false
    }

    // 检查内部滚动容器
    for (const [el, top] of internalScrollTops.entries()) {
        if (top > 0) return false
    }

    return true
}

// 监听 window 滚动（capture 阶段，捕获所有滚动）
const onScroll = (e) => {
    // 更新整体滚动状态
    const winScroll = window.scrollY || window.pageYOffset || 0
    const docScroll = document.documentElement.scrollTop || 0
    const bodyScroll = document.body.scrollTop || 0

    const winAtTop = winScroll === 0 && docScroll === 0 && bodyScroll === 0

    // 更新内部滚动容器状态
    const target = e.target
    if (target && target !== document && target !== window &&
        target !== document.body && target !== document.documentElement) {
        // 记录该元素的 scrollTop
        internalScrollTops.set(target, target.scrollTop || 0)
    }

    // 综合判断
    isAtTop = checkAllAtTop()
}

// 用 capture 阶段监听所有滚动事件（包括内部 div）
window.addEventListener('scroll', onScroll, { passive: true, capture: true })
document.addEventListener('scroll', onScroll, { passive: true, capture: true })


// 定期检查滚动状态（兜底，防止某些情况下 scroll 事件不触发）
setInterval(() => {
    isAtTop = checkAllAtTop()
}, 500)


document.addEventListener('touchstart', (e) => {
    if (isRefreshing) return
    if (!e.touches || !e.touches.length) return

    // 关键：检查是否在顶部（用追踪的 flag，不用实时读取）
    if (!isAtTop) {
        return
    }

    // 双重检查：实时读取一次
    if (!checkAllAtTop()) {
        isAtTop = false
        return
    }

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
}, { passive: false })

document.addEventListener('touchend', () => {
    if (!isPulling || isRefreshing) return
    isPulling = false

    if (distance >= refreshThreshold) {
        isRefreshing = true
        window.location.reload()
    }
    distance = 0
}, { passive: true })

document.addEventListener('touchcancel', () => {
    isPulling = false
    distance = 0
}, { passive: true })
