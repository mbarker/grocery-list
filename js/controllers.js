'use strict';

var ref = new Firebase('https://grocery-list-app.firebaseIO.com/');
var listsRef = ref.child('lists');
var groceryAppControllers = angular.module('groceryAppControllers', ['firebase']);

var ENTER_KEY = 13;
var DELAY_SAVE_TIME = 4000;
var FLASH_TIME = 1000;

groceryAppControllers.controller('GroceryAppCtrl', ['$scope', 'angularFire',
function ($scope, angularFire) {
    // Bind all of the lists
    $scope.lists = [];
    angularFire(listsRef, $scope, 'lists');
}]);

groceryAppControllers.controller('GroceryListCtrl', ['$scope', '$routeParams', '$location', 'angularFire',
function ($scope, $routeParams, $location, angularFire) {
    
    var currentListRef = null;
    var delaySave = null;
    var clearSavedMessage = null;
    $scope.list = null;
    $scope.saved = false;
    if ($routeParams.listId) {
        currentListRef = listsRef.child($routeParams.listId);
        angularFire(currentListRef, $scope, 'list');
    } else {
        $scope.list = list();
    }    
    
    $scope.saveList = function() {
        if (ensureList()) {
            if (!currentListRef) {
                console.log('New list');
                $scope.list.id = generateId();
                currentListRef = listsRef.child($scope.list.id);
            }
            
            currentListRef.set($scope.list);
            console.log('Saved!');
            var savedAlert = document.getElementById('saved-alert');
            if (clearSavedMessage) {
                clearTimeout(clearSavedMessage);
            }
            
            clearSavedMessage = setTimeout(function() {
                $scope.saved = false;
                $scope.$apply();
            }, FLASH_TIME);
            
            $scope.saved = true;
            $scope.$apply();
        }
    };
    
    $scope.done = function() {
        if (ensureList()) {
            $scope.saveList();
            $location.path('/lists/' + $scope.list.id);
        }
    };
    
    $scope.markDone = function(group, item) {
        item.done = true;
        var allDone = true;
        angular.forEach(group.items, function(i) {
            allDone &= i.done;
        });
        
        group.allDone = allDone;
        $scope.saveList();
    };
    
    $scope.parseRaw = function(e) {
        if (!ensureList()) {
            return;
        }
        
        // TODO: Use $timeout
        if (delaySave) {
            console.log('Delaying parsing');
            clearTimeout(delaySave);
        }
        
        delaySave = setTimeout(function() {
            console.log('Updating the current list');
            var lines = $scope.list.raw.split(/[\n\r]+/);
            var groups = [];
            var lastGroup = null;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                console.log("Line: '" + line + "'");
                console.log(line);
                var m = /^\s*[\-\=\*\~]\s*(.+)\s*$/g.exec(line);
                console.log("Item regex match: " + m);
                if (m && m[1].length > 0) {
                    if (!lastGroup) {
                        lastGroup = group('');
                        groups.push(lastGroup);
                    }
                    
                    lastGroup.items.push(item(m[1]));
                } else {
                    m = /^\s*(.+)\s*$/g.exec(line);
                    console.log("Group regex match: " + m);
                    if (m && m[1].length > 0) {
                        lastGroup = group(m[1]);
                        groups.push(lastGroup);
                    }
                }
            }
            
            $scope.list.groups = groups;
            $scope.saveList();
        }, DELAY_SAVE_TIME);
    };
    
    function ensureList() {
        if (!$scope.list) {
            console.error('There is no list in scope, something is wrong');
            return false;
        }
        
        return true;
    }
}]);
    
function list(name, groups) {
    return {
        id: null,
        name: name || 'New Grocery List',
        groups: groups || []
    };
}

function group(name, allDone, items) {
    return {
        name: name,
        allDone: allDone || false,
        items: items || []
    };
}

function item(name, done) {
    return {
        name: name,
        done: done || false
    };
}

function generateId() {
    return randomString(16);
}

function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}
