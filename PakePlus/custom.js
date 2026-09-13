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
