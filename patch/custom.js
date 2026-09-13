// ==================== 禁用双指缩放 ====================

// 注入 viewport meta，禁止用户缩放
const injectViewport = () => {
    // 移除已有的 viewport meta
    const existing = document.querySelector('meta[name="viewport"]')
    if (existing) {
        existing.remove()
    }
    // 注入新的 viewport meta
    const meta = document.createElement('meta')
    meta.name = 'viewport'
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no'
    if (document.head) {
        document.head.appendChild(meta)
    } else if (document.documentElement) {
        document.documentElement.appendChild(meta)
    }
}

// 立即注入一次
injectViewport()

// DOM ready 后再注入一次（确保覆盖网页自带的 viewport）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectViewport)
} else {
    injectViewport()
}


// ==================== 链接跳转处理 ====================

const hookClick = (e) => {
    // 防止某些特殊情况下 e.target 不是普通元素
    if (!(e.target instanceof Element)) {
        return
    }

    const origin = e.target.closest('a[href]')

    if (!origin) {
        return
    }

    // 判断当前链接是否应该打开新窗口
    const baseElement = document.querySelector(
        'head base[target="_blank"]'
    )

    const shouldHandle =
        origin.target === '_blank' ||
        (
            !origin.target &&
            baseElement
        )

    if (shouldHandle) {
        e.preventDefault()

        console.log('handle origin:', origin)

        // 在当前页面打开
        window.location.href = origin.href
    } else {
        console.log('not handle origin:', origin)
    }
}


// ==================== window.open 处理 ====================

// 保存原始的 window.open，必要时可以恢复
const originalWindowOpen = window.open

window.open = function (url, target, features) {
    console.log('open:', url, target, features)

    // 防止没有传入有效地址
    if (!url) {
        return null
    }

    // 强制在当前页面跳转
    window.location.href = url

    return null
}


// 使用捕获阶段监听点击事件
document.addEventListener(
    'click',
    hookClick,
    {
        capture: true
    }
)


// ==================== 下拉刷新处理 ====================

let startY = 0
let distance = 0
let isPulling = false
let isRefreshing = false

// 下拉超过 80 像素时触发刷新
const refreshThreshold = 80

// 检查指定位置是否可以触发下拉刷新（即所有滚动容器都在顶部）
const canPullToRefresh = (x, y) => {
    // 1. 检查 window/document 滚动位置
    const windowScrollY = window.scrollY || window.pageYOffset || 0
    const docScrollTop = document.documentElement.scrollTop || 0
    const bodyScrollTop = document.body.scrollTop || 0

    if (windowScrollY > 0 || docScrollTop > 0 || bodyScrollTop > 0) {
        return false
    }

    // 2. 用 elementFromPoint 找到触摸点下方的元素
    const element = document.elementFromPoint(x, y)
    if (!element) {
        return true
    }

    // 3. 向上遍历 DOM 树，检查所有滚动容器
    let current = element
    let depth = 0
    const maxDepth = 50  // 防止无限遍历

    while (current && current !== document.documentElement && depth < maxDepth) {
        const style = getComputedStyle(current)
        const overflowY = style.overflowY

        // 判断是否是滚动容器
        const canScroll =
            overflowY === 'auto' ||
            overflowY === 'scroll' ||
            overflowY === 'overlay'

        if (canScroll && current.scrollTop > 0) {
            // 滚动容器不在顶部，不触发下拉刷新
            return false
        }

        current = current.parentElement
        depth++
    }

    // 所有滚动容器都在顶部，可以触发下拉刷新
    return true
}


document.addEventListener(
    'touchstart',
    (e) => {
        // 正在刷新时不重复处理
        if (isRefreshing) {
            return
        }

        if (!e.touches || !e.touches.length) {
            return
        }

        const touch = e.touches[0]

        // 检查当前触摸位置是否可以触发下拉刷新
        if (!canPullToRefresh(touch.clientX, touch.clientY)) {
            return
        }

        startY = touch.clientY
        distance = 0
        isPulling = true

        console.log('开始检测下拉刷新')
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
        distance = Math.min(moveDistance, 120)

        // 阻止页面正常滚动
        e.preventDefault()

        if (distance >= refreshThreshold) {
            console.log('释放手指即可刷新')
        } else {
            console.log('继续下拉')
        }
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

            console.log('正在刷新页面...')

            // 重新加载当前页面
            window.location.reload()
        } else {
            console.log('下拉距离不足，不刷新')
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
