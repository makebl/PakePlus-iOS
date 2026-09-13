// ==================== 禁用双指缩放 ====================

// 注入 viewport meta，禁止用户缩放
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

// 检查触摸位置是否在页面顶部（所有滚动容器都在顶部）
const canPullToRefresh = (x, y) => {
    // 1. 检查 window/document 整体滚动
    if (window.scrollY > 0) return false
    if (window.pageYOffset > 0) return false
    if (document.documentElement.scrollTop > 0) return false
    if (document.body.scrollTop > 0) return false

    // 2. 用 elementFromPoint 找到触摸点下方的元素
    const element = document.elementFromPoint(x, y)
    if (!element) return true

    // 3. 向上遍历所有祖先元素，直接检查 scrollTop
    // 不依赖 overflow 属性，只要 scrollTop > 0 就不允许下拉
    let current = element
    let depth = 0
    while (current && current !== document.documentElement && depth < 50) {
        if (current.scrollTop > 0) {
            return false
        }
        current = current.parentElement
        depth++
    }

    return true
}


document.addEventListener('touchstart', (e) => {
    if (isRefreshing) return
    if (!e.touches || !e.touches.length) return

    const touch = e.touches[0]

    // 检查当前触摸位置是否可以触发下拉刷新
    if (!canPullToRefresh(touch.clientX, touch.clientY)) {
        return
    }

    startY = touch.clientY
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
