const { execSync } = require('child_process')
const fs = require('fs-extra')
const plist = require('plist')
const path = require('path')
const ppconfig = require('./ppconfig.json')

const updateContentView = async (safeArea) => {
    try {
        const contentViewPath = path.join(__dirname, '../PakePlus/ContentView.swift')
        let content = await fs.readFile(contentViewPath, 'utf8')
        if (safeArea === 'all') {
            console.log('safeArea is all')
        } else if (safeArea === 'top') {
            content = content.replace(/edges: \[\]/, `edges: [.leading, .trailing, .bottom]`)
        } else if (safeArea === 'bottom') {
            content = content.replace(/edges: \[\]/, `edges: [.top, .leading, .trailing]`)
        } else if (safeArea === 'left') {
            content = content.replace(/edges: \[\]/, `edges: [.top, .trailing, .bottom]`)
        } else if (safeArea === 'right') {
            content = content.replace(/edges: \[\]/, `edges: [.top, .leading, .bottom]`)
        } else if (safeArea === 'horizontal') {
            content = content.replace(/edges: \[\]/, `edges: [.top, .bottom]`)
        } else if (safeArea === 'vertical') {
            content = content.replace(/edges: \[\]/, `edges: [.leading, .trailing]`)
        }
        await fs.writeFile(contentViewPath, content)
        console.log(`Updated safeArea to: ${safeArea}`)
    } catch (error) {
        console.error('Error updating safeArea:', error)
        throw error
    }
}

const updatePPPwdHtml = (startMethod, startPwd, pwdTitle, pwdBtn, pwdPlace, pwdTip, pwdError, pwdStyle, pwdTheme, webUrl, isHtml) => {
    try {
        const indexHtmlPath = path.join(__dirname, './www/pppwd.html')
        if (!fs.existsSync(indexHtmlPath)) {
            console.log('pppwd.html not found, skip')
            return
        }
        const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8')
        const targetUrl = isHtml ? './index.html' : webUrl
        const newIndexHtml = indexHtml
            .replaceAll('startMethod', startMethod)
            .replaceAll('startPwd', startPwd || '123456')
            .replaceAll('pwdTitle', pwdTitle || '请输入密码')
            .replaceAll('pwdBtn', pwdBtn || '验证')
            .replaceAll('pwdPlace', pwdPlace || '')
            .replaceAll('pwdTip', pwdTip || '')
            .replaceAll('pwdError', pwdError || '密码错误')
            .replaceAll('pwdStyle', pwdStyle || 'flat')
            .replaceAll('pwdTheme', pwdTheme || 'dark')
            .replaceAll('https://pakeplus.com/', targetUrl)
        fs.writeFileSync(indexHtmlPath, newIndexHtml)
        console.log('updatePPPwdHtml success')
    } catch (error) {
        console.error('Error updating pppwd.html:', error)
        throw error
    }
}

const updateProject = async (newBundleId, showName, direction = 'default') => {
    const pbxprojPath = path.join(__dirname, '../PakePlus.xcodeproj/project.pbxproj')
    try {
        let content = fs.readFileSync(pbxprojPath, 'utf8')
        content = content.replaceAll(/PRODUCT_BUNDLE_IDENTIFIER = (.*?);/g, `PRODUCT_BUNDLE_IDENTIFIER = ${newBundleId};`)
        content = content.replaceAll(/INFOPLIST_KEY_CFBundleDisplayName = (.*?);/g, '')
        if (direction === 'default') {
            content = content.replaceAll(/INFOPLIST_KEY_UISupportedInterfaceOrientations = (.*?);/g, `INFOPLIST_KEY_UISupportedInterfaceOrientations = "UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight UIInterfaceOrientationPortrait";`)
        } else if (direction === 'vertical') {
            content = content.replaceAll(/INFOPLIST_KEY_UISupportedInterfaceOrientations = (.*?);/g, `INFOPLIST_KEY_UISupportedInterfaceOrientations = "UIInterfaceOrientationPortrait";`)
        } else if (direction === 'horizontal') {
            content = content.replaceAll(/INFOPLIST_KEY_UISupportedInterfaceOrientations = (.*?);/g, `INFOPLIST_KEY_UISupportedInterfaceOrientations = "UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";`)
        }
        fs.writeFileSync(pbxprojPath, content)
        console.log(`Updated project: bundleId=${newBundleId}, showName=${showName}`)
    } catch (error) {
        console.error('Error updating Bundle ID:', error)
        throw error
    }
}

const updateInfoPlist = async (showName, debug, webUrl, isHtml, safeArea, userAgent, launchImage, screenOn, clearCache, startMethod) => {
    const infoPlistPath = path.join(__dirname, '../PakePlus/Info.plist')
    const infoPlist = fs.readFileSync(infoPlistPath, 'utf8')
    const infoPlistData = plist.parse(infoPlist)
    infoPlistData.CFBundleDisplayName = showName
    if (startMethod === 'password' || startMethod === 'oncePwd') {
        infoPlistData.WEBURL = 'https://www.password.com/'
        fs.copySync(path.join(__dirname, './www'), path.join(__dirname, '../PakePlus'))
    } else if (isHtml) {
        infoPlistData.WEBURL = 'https://www.pakeplus.com/'
        fs.copySync(path.join(__dirname, './www'), path.join(__dirname, '../PakePlus'))
    } else {
        infoPlistData.WEBURL = webUrl
        fs.rmSync(path.join(__dirname, '../PakePlus/index.html'), { force: true })
    }
    if (debug) {
        infoPlistData.DEBUG = debug
    } else {
        fs.rmSync(path.join(__dirname, '../PakePlus/vConsole.js'), { force: true })
    }
    infoPlistData.USERAGENT = userAgent || ''
    infoPlistData.FULLSCREEN = (safeArea === 'fullscreen')
    infoPlistData.CLEARCACHE = !!clearCache
    if (launchImage) {
        infoPlistData.LAUNCHIMAGE = true
        const launchPath = path.join(__dirname, '../launch.jpg')
        const launchImageDir = path.join(__dirname, '../PakePlus/Assets.xcassets/LaunchScreen.imageset')
        const launchImagePath = path.join(launchImageDir, 'launch.jpg')
        fs.mkdirSync(launchImageDir, { recursive: true })
        fs.copyFileSync(launchPath, launchImagePath)
        console.log('Copied launchImage to LaunchScreen.imageset')
    } else {
        infoPlistData.LAUNCHIMAGE = false
        fs.rmSync(path.join(__dirname, '../PakePlus/Assets.xcassets/LaunchScreen.imageset'), { recursive: true, force: true })
    }
    infoPlistData.SCREENON = !!screenOn
    console.log('new infoPlist WEBURL:', infoPlistData.WEBURL)
    console.log('new infoPlist CFBundleDisplayName:', infoPlistData.CFBundleDisplayName)
    console.log('new infoPlist CLEARCACHE:', infoPlistData.CLEARCACHE)
    fs.writeFileSync(infoPlistPath, plist.build(infoPlistData))
    console.log('Info.plist updated')
}

const main = async () => {
    const { launchImage, direction, startMethod, startPwd, pwdTitle, pwdBtn, pwdPlace, pwdTip, pwdError, pwdStyle, pwdTheme } = ppconfig.phone || {}
    const { name, showName, version, webUrl, id, pubBody, debug, safeArea, isHtml } = ppconfig.ios || {}
    const clearCache = ppconfig.ios.clearCache
    const userAgent = ppconfig.ios.userAgent
    const screenOn = ppconfig.ios.screenOn
    console.log('Config loaded:')
    console.log('  name:', name)
    console.log('  showName:', showName)
    console.log('  webUrl:', webUrl)
    console.log('  id:', id)
    console.log('  clearCache:', clearCache)
    console.log('  userAgent:', userAgent)
    console.log('  screenOn:', screenOn)
    console.log('  launchImage:', launchImage)
    console.log('  safeArea:', safeArea)
    console.log('  startMethod:', startMethod)
    await updateContentView(safeArea)
    updatePPPwdHtml(startMethod, startPwd, pwdTitle, pwdBtn, pwdPlace, pwdTip, pwdError, pwdStyle, pwdTheme, webUrl, isHtml)
    await updateProject(id, showName, direction)
    const envPath = process.env.GITHUB_ENV
    if (envPath) {
        fs.appendFileSync(envPath, `NAME=${name}\nVERSION=${version}\nPUBBODY=${pubBody}\nISHTML=${isHtml}\n`)
    }
    await updateInfoPlist(showName, debug, webUrl, isHtml, safeArea, userAgent, launchImage, screenOn, clearCache, startMethod)
    const infoPlistPath = path.join(__dirname, '../PakePlus/Info.plist')
    const finalPlist = fs.readFileSync(infoPlistPath, 'utf8')
    const finalData = plist.parse(finalPlist)
    console.log('\n===== 最终验证 =====')
    console.log('CFBundleDisplayName:', finalData.CFBundleDisplayName)
    console.log('WEBURL:', finalData.WEBURL)
    console.log('Worker Success')
}

(async () => {
    try {
        console.log('worker start')
        await main()
        console.log('worker end')
    } catch (e) {
        console.error('Worker Error:', e)
        process.exit(1)
    }
})()
