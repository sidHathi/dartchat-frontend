//
//  RNUserDefaults.m
//  dartchat
//
//  Created by Siddharth Hathi on 9/4/23.
//

#import <Foundation/Foundation.h>
#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_MODULE(RNUserDefaults, NSObject)

//RCT_EXTERN_METHOD(validate: (NSString *)validationString)

RCT_EXTERN_METHOD(
  storeData: (NSString*)key
  val:(NSString*)val
)

@end
