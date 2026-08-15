require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

# Capacitor 8 は SPM が既定のため通常このファイルは使われない。
# CocoaPods 運用に切り替えたくなったとき用に残してある。
Pod::Spec.new do |s|
  s.name = 'ArcodaRecorder'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = package['repository']['url']
  s.author = package['author']
  s.source = { :git => package['repository']['url'], :tag => s.version.to_s }
  s.source_files = 'ios/Sources/ArcodaRecorderPlugin/*.{swift,h,m,c,cc,mm,cpp}'
  s.ios.deployment_target = '15.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.9'
end
