//
//  WebView.swift
//  PakePlus
//
//  Created by Song on 2025/3/30.
//

import AVFoundation
import CoreLocation
import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    let webUrl: URL
    let debug: Bool
    let onLoadFinished: (() -> Void)?
    let userAgent = Bundle.main.object(forInfoDictionaryKey: "USERAGENT") as? String ?? ""

    func makeUIView(context: Context) -> WKWebView {
        let webConfiguration = WKWebViewConfiguration()
        webConfiguration.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        webConfiguration.setValue(true, forKey: "allowUniversalAccessFromFileURLs")
        webConfiguration.allowsInlineMediaPlayback = true
        webConfiguration.allowsPictureInPictureMediaPlayback = true
        webConfiguration.ignoresViewportScaleLimits = true
        webConfiguration.allowsAirPlayForMediaPlayback = true
        webConfiguration.selectionGranularity = .character
        if #available(iOS 16.4, *) {
            webConfiguration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        } else {
            webConfiguration.preferences.setValue(true, forKey: "developerExtrasEnabled")
            UserDefaults.standard.set(true, forKey: "WebKitDeveloperExtras")
        }
        let webView = WKWebView(frame: .zero, configuration: webConfiguration)
        webView.uiDelegate = context.coordinator
        webView.navigationDelegate = context.coordinator
        if !userAgent.isEmpty {
            webView.customUserAgent = userAgent
        }
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        if debug {
            if #available(iOS 16.4, *) {
                webView.isInspectable = true
            } else {
                webView.setValue(true, forKey: "inspectable")
            }
        }
        webView.scrollView.isScrollEnabled = true
        webView.scrollView.bounces = true
        webView.scrollView.minimumZoomScale = 1.0
        webView.scrollView.maximumZoomScale = 1.0

        // 禁用缓存
        let clearCache = Bundle.main.object(forInfoDictionaryKey: "CLEARCACHE") as? Bool ?? false
        if clearCache {
            URLCache.shared.removeAllCachedResponses()
            URLCache.shared.diskCapacity = 0
            URLCache.shared.memoryCapacity = 0
            let dateStore = WKWebsiteDataStore.default()
            dateStore.fetchDataRecords(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes()) { records in
                dateStore.removeData(ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(), for: records) {
                    print("清除缓存完成")
                }
            }
        }

        let request = URLRequest(url: webUrl, cachePolicy: clearCache ? .reloadIgnoringLocalCacheData : .useProtocolCachePolicy)
        webView.load(request)

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKUIDelegate, WKNavigationDelegate, CLLocationManagerDelegate {
        var parent: WebView
        var locationManager: CLLocationManager?
        var currentGeolocationCallback: ((CLAuthorizationStatus) -> Void)?

        init(_ parent: WebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) {
            decisionHandler(.grant)
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if ((navigationAction.request.url?.absoluteString) != nil) {
                webView.load(URLRequest(url: navigationAction.request.url!))
            }
            return nil
        }

        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in completionHandler() })
            if let vc = UIApplication.shared.connectedScenes.compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController }).first {
                vc.present(alert, animated: true)
            }
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, decisionHandler: @escaping (Bool) -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in decisionHandler(true) })
            alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in decisionHandler(false) })
            if let vc = UIApplication.shared.connectedScenes.compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController }).first {
                vc.present(alert, animated: true)
            }
        }

        func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
            let alert = UIAlertController(title: prompt, message: nil, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in completionHandler(alert.textFields?.first?.text) })
            alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in completionHandler(nil) })
            alert.addTextField { $0.text = defaultText }
            if let vc = UIApplication.shared.connectedScenes.compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController }).first {
                vc.present(alert, animated: true)
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.onLoadFinished?()
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            print("WebView load failed:", error.localizedDescription)
            parent.onLoadFinished?()
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            print("WebView load provisional failed:", error.localizedDescription)
            parent.onLoadFinished?()
        }

        func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
            download.delegate = self
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if navigationAction.shouldPerformDownload {
                decisionHandler(.download)
            } else {
                decisionHandler(.allow)
            }
        }

        func webView(_ webView: WKWebView, navigationAction: WKNavigationAction, didBecome download: WKDownload) {
            download.delegate = self
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
            let mimeType = navigationResponse.response.mimeType ?? ""
            let url = navigationResponse.response.url?.absoluteString ?? ""
            if let httpResponse = navigationResponse.response as? HTTPURLResponse,
               let contentDisposition = httpResponse.allHeaderFields["Content-Disposition"] as? String,
               contentDisposition.contains("attachment") {
                decisionHandler(.download)
                return
            }
            let suffix = (url as NSString).pathExtension
            let downloadSuffix = ["png", "jpg", "jpeg", "gif", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "zip", "rar", "7z", "mp4", "mp3", "txt", "csv", "apk", "exe", "dmg", "pkg", "iso"]
            if downloadSuffix.contains(suffix) {
                decisionHandler(.download)
            } else {
                decisionHandler(.allow)
            }
        }

        func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
            currentGeolocationCallback?(status)
            currentGeolocationCallback = nil
        }
    }
}

extension WebView.Coordinator: WKDownloadDelegate {
    func download(_ download: WKDownload, decideDestinationUsing destinationURL: URL?, suggestedFilename: String?, completionHandler: @escaping (URL?) -> Void) {
        let downloadsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let destURL = downloadsPath.appendingPathComponent(suggestedFilename ?? "file")
        if FileManager.default.fileExists(atPath: destURL.path) {
            try? FileManager.default.removeItem(atPath: destURL.path)
        }
        completionHandler(destURL)
    }

    func downloadDidFinish(_ download: WKDownload) {
        guard let originalURL = download.originalCall?.request.url else { return }
        let downloadsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let destURL = downloadsPath.appendingPathComponent(download.suggestedFilename ?? "file")
        let activity = UIActivityViewController(activityItems: [destURL], applicationActivities: nil)
        if let vc = UIApplication.shared.connectedScenes.compactMap({ ($0 as? UIWindowScene)?.keyWindow?.rootViewController }).first {
            vc.present(activity, animated: true)
        }
    }

    func download(_ download: WKDownload, didFailWithError error: Error) {
        print("Download failed:", error.localizedDescription)
    }
}