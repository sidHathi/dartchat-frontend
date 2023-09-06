//
//  RNUserDefaults.swift
//  dartchat
//
//  Created by Siddharth Hathi on 9/4/23.
//

import React

@objc(RNUserDefaults)
public class RNUserDefaults: NSObject {
  @objc(: val:) func storeData(_ key: String, val: String) -> Void {
    UserDefaults.standard.set(val as String, forKey: key as String);
    NSLog("data set in user default store");
  }
  
  @objc
  func validate(_ validationString: String?) -> Void {
    NSLog(validationString ?? "No validation string");
    NSLog("native function called")
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
