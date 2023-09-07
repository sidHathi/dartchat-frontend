//
//  objc_utitlity.m
//  dartchat
//
//  Created by Siddharth Hathi on 9/5/23.
//

#import <Foundation/Foundation.h>
#import "objc_rn.h"

@implementation OCUserDefaults

RCT_EXPORT_MODULE();
- (NSString *)hello{
  NSLog( @"Hello world !");
  return @"Hello world !";
}

RCT_EXPORT_METHOD(sayHello: (RCTResponseSenderBlock)callback{
  callback(@[[NSNull null], self.hello]);
});

RCT_EXPORT_METHOD(storeData: (NSString*)key val:(NSString*)val {
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName: @"group.dartchat"];
  [defaults setObject: val forKey: key];
  NSLog(@"data stored for key %@", key);
  NSLog(@"%@", val);
});

RCT_EXPORT_METHOD(removeData: (NSString*)key {
  NSUserDefaults *defaults = [[NSUserDefaults alloc] initWithSuiteName: @"group.dartchat"];
  [defaults removeObjectForKey: key];
  NSLog(@"KEY REMOVED");
  NSLog(@"%@", key);
});

@end