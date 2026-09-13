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


// ==================== 下拉刷新处理 ====================

let startY = 0
let distance = 0
let isPulling = false
let isRefreshing = false

// 下拉超过 200 像素时才触发刷新（防止误碰）
const refreshThreshold = 200

// 最大下拉距离
const maxDistance = 250

document.addEventListener(
    'touchstart',
    (e) => {
        // 正在刷新时不重复处理
        if (isRefreshing) {
            return
        }

        // 页面没有滚动到顶部时，不触发下拉刷新
        if (window.scrollY !== 0) {
            return
        }

        if (!e.touches || !e.touches.length) {
            return
        }

        startY = e.touches[0].clientY
        distance = 0
        isPulling = true
    },
    {
        passive: true
    }
)

document.addEventListener(
    'touchmove',
    (e) => {
        if (!isPulling || isRefreshing) {
            return
        }

        if (!e.touches || !e.touches.length) {
            return
        }

        const currentY = e.touches[0].clientY
        const moveDistance = currentY - startY

        // 手指向上滑动时，不处理
        if (moveDistance <= 0) {
            distance = 0
            return
        }

        // 限制最大下拉距离
        distance = Math.min(moveDistance, maxDistance)

        // 阻止页面正常滚动
        e.preventDefault()
    },
    {
        // 必须设置为 false，否则 preventDefault() 无效
        passive: false
    }
)

document.addEventListener(
    'touchend',
    () => {
        if (!isPulling || isRefreshing) {
            return
        }

        isPulling = false

        if (distance >= refreshThreshold) {
            isRefreshing = true
            window.location.reload()
        }

        distance = 0
    },
    {
        passive: true
    }
)

document.addEventListener(
    'touchcancel',
    () => {
        isPulling = false
        distance = 0
    },
    {
        passive: true
    }
)
