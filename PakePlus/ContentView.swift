//
//  ContentView.swift
//  PakePlus
//
//  Created by Song on 2025/3/29.
//

import SwiftUI
import UIKit

struct ContentView: View {
    // read value from info
    let webUrl = Bundle.main.object(forInfoDictionaryKey: "WEBURL") as? String ?? ""
    let debug = Bundle.main.object(forInfoDictionaryKey: "DEBUG") as? Bool ?? false
    let fullScreen = Bundle.main.object(forInfoDictionaryKey: "FULLSCREEN") as? Bool ?? false
    let screenOn = Bundle.main.object(forInfoDictionaryKey: "SCREENON") as? Bool ?? false

    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        // webview
        WebView(
            webUrl: URL(string: webUrl)!,
            debug: debug,
            onLoadFinished: nil
        )
        .ignoresSafeArea(edges: [.all])
        .statusBarHidden(fullScreen)
        .onAppear {
            UIApplication.shared.isIdleTimerDisabled = screenOn
        }
        .onChange(of: scenePhase) { phase in
            UIApplication.shared.isIdleTimerDisabled = screenOn && (phase == .active)
        }
    }
}

// #Preview {
//     ContentView()
// }
