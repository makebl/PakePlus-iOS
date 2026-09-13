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

// ==================== 强制所有邮箱卡片可见 ====================
// 不管什么原因隐藏了卡片，都强制显示
const forceMailboxVisible = () => {
    const cards = document.querySelectorAll('.mailbox-card')
    console.log('找到邮箱卡片数:', cards.length)
    cards.forEach((card, i) => {
        const addr = card.querySelector('.mb-addr')?.textContent?.trim() || '未知'
        const style = getComputedStyle(card)
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            console.warn(`卡片 ${i} (${addr}) 被隐藏了! display=${style.display} visibility=${style.visibility} opacity=${style.opacity}`)
        }
        // 强制可见
        card.style.setProperty('display', 'block', 'important')
        card.style.setProperty('visibility', 'visible', 'important')
        card.style.setProperty('opacity', '1', 'important')
        card.style.setProperty('height', 'auto', 'important')
        card.style.setProperty('max-height', 'none', 'important')
        card.style.setProperty('overflow', 'visible', 'important')
        card.style.setProperty('flex-shrink', '0', 'important')
    })
}

// 监听 DOM 变化，防止 JS 后续隐藏
const observer = new MutationObserver(() => {
    forceMailboxVisible()
})

// 初始执行 + DOM 加载后执行 + 延迟执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        forceMailboxVisible()
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] })
    })
} else {
    forceMailboxVisible()
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] })
}
setTimeout(forceMailboxVisible, 500)
setTimeout(forceMailboxVisible, 1000)
setTimeout(forceMailboxVisible, 2000)
setTimeout(forceMailboxVisible, 3000)

// ==================== 修复 Bootstrap 布局 ====================
const fixStyle = document.createElement('style')
fixStyle.textContent = `
.mailbox-card {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    flex-shrink: 0 !important;
}
.mailbox-card .row {
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
}
.mailbox-card .col-md-6 {
    flex: 1 1 auto !important;
    min-width: 0 !important;
}
.mailbox-card .col-md-3 {
    flex: 0 0 auto !important;
}
#mailboxesContainer {
    overflow: visible !important;
    max-height: none !important;
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
