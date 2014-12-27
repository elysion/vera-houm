var http = require('http')
var Scene = require('./js/lib/vera/scene')
var Device = require('./js/lib/vera/upnp-device')
var DeviceStatus = require('./js/lib/vera/device-status')
var Houmio = require('./js/lib/houmio')
var ON = DeviceStatus.ON
var OFF = DeviceStatus.OFF

var responses = Houmio.init({publish: 'vera', subscribe: 'vera'})

var veraEvents = responses.filter(isVeraEvent).map('.data');

var sceneActivations = veraEvents.filter(isVeraScene).map(function(data) {
  return data.devaddr.substr('scene: '.length)
})

sceneActivations.assign(function(sceneId) {
  Scene.runScene(sceneId)
})

var deviceEvents = veraEvents.filter(isVeraDevice)

var dimmableEvents = deviceEvents.filter(isDimmable).map(function(data) {
  return {device: data.devaddr.substr('device: '.length), level: parseInt(data.bri*100/255)}
})

dimmableEvents.assign(function(data) {
  Device.setDimmerLevel(data.device, data.level)
})

var switchEvents = deviceEvents.filter(not(isDimmable)).map(function(data) {
  return {device: data.devaddr.substr('device: '.length), status: data.on ? ON : OFF}
})

switchEvents.assign(function(data) {
  Device.setDeviceStatus(data.device, data.status)
})

function isVeraScene(data) {
  return data.devaddr.indexOf('scene') != -1
}

function isVeraDevice(data) {
  return data.devaddr.indexOf('device') != -1
}

function isVeraEvent(res) {
  return !!res.data && res.data.vendor == 'vera' && !!res.data.devaddr
}

function isDimmable(data) {
  return data.type == 'dimmable'
}

function not(func) {
  return function() {
    return !func.apply(this, arguments)
  }
}