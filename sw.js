"use strict";

//New

var carDealsCacheName = 'carDealsCacheV2';
var carDealsCachePagesName = 'carDealsCachePagesV2';
var carDealsCacheImagesName = 'carDealsCacheImagesV2';

var carDealsCacheFiles = [
    'index.html',
    'js/app.js',
    'js/carService.js',
    'js/clientStorage.js',
    'js/swRegister.js',
    'js/template.js',
    'js/pushNotification/push-notification.js',
    './',
    'resources/es6-promise/es6-promise.js',
    'resources/fetch/fetch.js',
    'resources/localforage/localforage.min.js',
    'resources/localforage/localforage-getitems.js',
    'resources/localforage/localforage-setitems.js',
    'resources/material-design-lite/material.min.js',
    'resources/material-design-lite/material.min.js.map',
    'resources/material-design-lite/material.red-indigo.min.css',
    'resources/systemjs/system.js',
    'resources/systemjs/system-polyfills.js'
];

var latestPath = '/pluralsight/courses/progressive-web-apps/service/latest-deals.php';
var imagePath = '/pluralsight/courses/progressive-web-apps/service/car-image.php';
var carPath = '/pluralsight/courses/progressive-web-apps/service/car.php';

self.addEventListener('install', function(event){
    console.log('From SW: Install Event', event);
    self.skipWaiting();
    event.waitUntil(
        caches.open(carDealsCacheName)
            .then(function(cache){
                return cache.addAll(carDealsCacheFiles);
            })
    );
});

self.addEventListener('activate', function(event){
    console.log('From SW: Activate State', event);
    self.clients.claim();
    event.waitUntil(
        caches.keys()
            .then(function(cacheKeys){
                var deletePromises = [];
                for(var i = 0; i < cacheKeys.length; i++){
                    if(cacheKeys[i] != carDealsCacheName &&
                        cacheKeys[i] != carDealsCachePagesName &&
                        cacheKeys[i] != carDealsCacheImagesName){
                        deletePromises.push(caches.delete(cacheKeys[i]));
                    }
                }
                return Promise.all(deletePromises);
            })
    )
});
// all network request go throw this event.
self.addEventListener('fetch', function(event){
    console.log('requestFile', event.request.url);
    var requestUrl = new URL(event.request.url);
    var requestPath = requestUrl.pathname;
    var fileName = requestPath.substring(requestPath.lastIndexOf('/') + 1);

    if(requestPath == latestPath || fileName == "sw.js"){
        event.respondWith(fetch(event.request));
    }else if(requestPath == imagePath){
        event.respondWith(networkFirstStrategy(event.request));
    }else{
        event.respondWith(cacheFirstStrategy(event.request));
    }
});

//start push notification section.
self.addEventListener('push', function(event) {
    debugger;
    console.log('[Service Worker] Push Received', event);
    console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

    const title = 'Ma iti';
    const options = {
        body: event.data.text(),
        icon: 'images/icon.png',
        badge: 'images/badge.png'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
    console.log('[Service Worker] Notification click Received.');
    console.log('push click event', event);
    // close the notification popup.
    event.notification.close();

    event.waitUntil(
        clients.openWindow('http://vap.brndex.com')
    );
});

//end push notification section.















function cacheFirstStrategy(request){
    return caches.match(request).then(function(cacheResponse){
        return cacheResponse || fetchRequestAndCache(request);
    });
}

function networkFirstStrategy(request){
    return fetchRequestAndCache(request).catch(function(response){
        return caches.match(request);
    });
}

function fetchRequestAndCache(request){
    return fetch(request).then(function(networkResponse){
        caches.open(getCacheName(request)).then(function(cache){
            cache.put(request, networkResponse);
        });
        return networkResponse.clone();
    });
}

function getCacheName(request){
    var requestUrl = new URL(request.url);
    var requestPath = requestUrl.pathname;

    if(requestPath == imagePath){
        return carDealsCacheImagesName;
    }else if(requestPath == carPath){
        return carDealsCachePagesName;
    }else{
        return carDealsCacheName;
    }
}

self.addEventListener('message', function(event){
 event.source.postMessage({clientId:event.source.id, message:'sw'});
 });