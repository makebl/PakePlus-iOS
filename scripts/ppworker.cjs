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
} catch (error) {
    console.error('Error updating Bundle ID:', error)
    throw error
}
}