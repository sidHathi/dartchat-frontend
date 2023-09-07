//
//  RNUserDefaults.m
//  dartchat
//
//  Created by Siddharth Hathi on 9/4/23.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"

// THIS MODULE DOES NOT WORK -> SWIFT BRIDGE FAILS
// SEE objc_rn.m FOR WORKING OBJC BRIDGE

@interface RCT_EXTERN_MODULE(RNUserDefaults, NSObject)

//RCT_EXTERN_METHOD(validate: (NSString *)validationString)

RCT_EXTERN_METHOD(
  storeData: (NSString*)key
  val:(NSString*)val
)

@end
