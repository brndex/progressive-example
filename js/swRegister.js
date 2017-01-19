/**
 * Created by hailevi on 10/01/2017.
 */

define([], function () {
    var pushButton = document.querySelector('#enable-push');
    var isSubscribed = false;
    var applicationServerPublicKey = 'BIGz1vwUy89Bs-h3xzPjuaGidGuOwzXWqzeYOUuBS2M33rcPlpNx-onIHIHNRFKQjchSEFAIilYjRAxDYoizMkg';
    var baseURL = 'https://progressiveapp-95420.app.xervo.io/api/';
    // var baseURL = 'http://localhost:8888/api/';
    var swRegistration = null;



    /*
     *
     *  Push Notifications codelab
     *  Copyright 2015 Google Inc. All rights reserved.
     *
     *  Licensed under the Apache License, Version 2.0 (the "License");
     *  you may not use this file except in compliance with the License.
     *  You may obtain a copy of the License at
     *
     *      https://www.apache.org/licenses/LICENSE-2.0
     *
     *  Unless required by applicable law or agreed to in writing, software
     *  distributed under the License is distributed on an "AS IS" BASIS,
     *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     *  See the License for the specific language governing permissions and
     *  limitations under the License
     *
     */

//End Push Notification Section
    var sendElem = document.querySelector('#send');
    if(sendElem) {
        document.querySelector('#send').onclick = function() {
            var delay = document.querySelector('#notification-delay').value;
            var ttl = document.querySelector('#notification-ttl').value;
            var title = document.querySelector('#notification-title').value;
            var content = document.querySelector('#notification-content').value;
            fetch(baseURL + 'sendpush?delay=' + delay + '&ttl=' + ttl + '&title=' + title + '&content=' + content,
                {
                    method: 'post'
                }
            );
        };
    }

    function urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (var i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    function updateBtn() {
        document.getElementById("push-status").innerHTML = 'push feature: ' + Notification.permission;
        if (Notification.permission === 'denied') {
            pushButton.textContent = 'Push Messaging Blocked.';
            pushButton.disabled = true;
            // updateSubscriptionOnServer(null);
            return;
        }

        if (isSubscribed) {
            pushButton.textContent = 'Disable Push Messaging';
        } else {
            pushButton.textContent = 'Enable Push Messaging';
        }
        pushButton.disabled = false;
    }

    function updateSubscriptionOnServer(subscription) {
        // TODO: Send subscription to application server
        fetch(baseURL + 'push-register', {
            method: 'post',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                subscription: subscription
            })
        });
        // const subscriptionJson = document.querySelector('.js-subscription-json');
        // const subscriptionDetails = document.querySelector('.js-subscription-details');
        //
        // if (subscription) {
        //     subscriptionJson.textContent = JSON.stringify(subscription);
        //     subscriptionDetails.classList.remove('is-invisible');
        // } else {
        //     subscriptionDetails.classList.add('is-invisible');
        // }
    }

    function subscribeUser() {
        const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
        swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        })
            .then(function(subscription) {
                console.log('User is subscribed:', subscription);
                if(subscription) {
                    updateSubscriptionOnServer(subscription);
                    isSubscribed = true;
                }

                updateBtn();
            })
            .catch(function(err) {
                console.log('Failed to subscribe the user: ', err);
                updateBtn();
            });
    }

    function unsubscribeUser() {
        swRegistration.pushManager.getSubscription()
            .then(function(subscription) {
                if (subscription) {
                    return subscription.unsubscribe();
                }
            })
            .catch(function(error) {
                console.log('Error unsubscribing', error);
            })
            .then(function() {
                //updateSubscriptionOnServer(null);

                console.log('User is unsubscribed.');
                isSubscribed = false;

                updateBtn();
            });
    }

    function initialiseUI() {
        pushButton.addEventListener('click', function() {
            pushButton.disabled = true;
            if (isSubscribed) {
                unsubscribeUser();
            } else {
                subscribeUser();
            }
        });

        // Set the initial subscription value
        swRegistration.pushManager.getSubscription()
            .then(function(subscription) {
                isSubscribed = !(subscription === null);
                if (isSubscribed) {
                    updateSubscriptionOnServer(subscription);
                    console.log('User IS subscribed.');
                } else {
                    console.log('User is NOT subscribed.');
                }

                updateBtn();
            });
    }











    if('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(function (swReg) {
                swRegistration = swReg;
                var serviceWorker;
                if(swRegistration.installing) {
                    console.log('Resolved at installing: ', swRegistration);
                    serviceWorker = swRegistration.installing;
                } else if(swRegistration.waiting) {
                    console.log('Resolved at installed/waiting', swRegistration);
                    serviceWorker = swRegistration.waiting;
                } else if(swRegistration.active) {
                    console.log('Resolved at activated', swRegistration);
                    serviceWorker = swRegistration.active;
                }
                if(serviceWorker) {
                    serviceWorker.addEventListener('statechange', function (e) {
                        console.log(e.target.state);
                    })
                }

                //start push section
                if ('PushManager' in window) {
                    console.log('Service Worker and Push is supported');
                    initialiseUI();

                } else {
                    console.warn('Push messaging is not supported');
                    pushButton.textContent = 'Push Not Supported';
                }
                //end push section


                swRegistration.addEventListener('updatefound', function(e) {
                    swRegistration.installing.addEventListener('statechange', function (e) {
                        console.log('New service worker state ', e.target.state);
                    });
                    console.log('New service worker found', swRegistration);
                });

                setInterval(function() {
                    swRegistration.update();
                }, 5000);



                //Start Push Notification Section
                document.querySelector('#resetButton').addEventListener('click',
                    function() {
                        navigator.serviceWorker.getRegistration().then(function(registration) {
                            registration.unregister();
                            window.location.reload();
                        });
                    }
                );




                console.log(swRegistration);
            }).catch(function (error) {
            console.log(error);
        });

        navigator.serviceWorker.addEventListener('controllerchange', function(e) {
            console.log('Controller Changed');
        });

        navigator.serviceWorker.addEventListener('message', function(event) {
            var clientId = event.data.clientId;
            var message = event.data.message;
            console.log('From Client: ', clientId, message);
        });

        if(navigator.serviceWorker.controller != null) {
            navigator.serviceWorker.controller.postMessage('hello');
        }
    }

    function printStatus(status) {
        document.querySelector('#status').innerHTML = status;
    }

});





