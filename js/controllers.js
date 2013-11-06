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
    
    $scope.showMenu = false;
    $scope.toggleMenu = function() {
        $scope.showMenu = !$scope.showMenu;
        console.log('Show menu: ' + $scope.showMenu);
    };
    
    
}]);

groceryAppControllers.controller('GroceryListCtrl', ['$scope', '$routeParams', '$location', '$timeout', 'angularFire',
function ($scope, $routeParams, $location, $timeout, angularFire) {
    
    $scope.list = null;
    $scope.saved = false;
    if ($routeParams.listId) {
        bindList($routeParams.listId);
    } else {
        $scope.list = list();
    }    
    
    $scope.createNew = function() {
        if (ensureList() && !$scope.list.id) {
            console.log('Creating a new list');
            $scope.list.id = generateId();
            reparseRaw();
            bindList($scope.list.id);
            $scope.flashSaved();
            $location.path('/lists/' + $scope.list.id);
        }
    };
    
    var rawChanged = false;
    $scope.saveExisting = function() {
        if (ensureList() && $scope.list.id && rawChanged) {
            console.log('Forcing a save');
            reparseRaw();
            $timeout.cancel(delaySave);
            $scope.flashSaved();
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
    };
    
    var delaySave = null;
    $scope.parseRaw = function(e) {
        if (ensureList() && $scope.list.id) { 
            console.log('Raw changed');
            rawChanged = true;
            $timeout.cancel(delaySave);
            delaySave = $timeout(reparseRaw, DELAY_SAVE_TIME);
        }
    };
    
    var delayMessage = null;
    $scope.flashSaved = function() {
        if (ensureList() && $scope.list.id) {
            console.log('Saved!');
            $scope.message = 'Saved';
            
            $timeout.cancel(delayMessage);
            delayMessage = $timeout(function() {
                $scope.message = '';
            }, FLASH_TIME);
        }
    };
    
    function reparseRaw() {
        if (!ensureList()) {
            return;
        }
        
        console.log('Updating the current list');
        var lines = $scope.list.raw.split(/[\n\r]+/);
        var lastGroup = null;
        $scope.list.groups.splice(0, $scope.list.groups.length);
        angular.forEach(lines, function(line, i) {
            var line = lines[i];
            console.log("Line: '" + line + "'");
            console.log(line);
            var m = /^\s*[\-\=\*\~]\s*(.+)\s*$/g.exec(line);
            console.log("Item regex match: " + m);
            if (m && m[1].length > 0) {
                if (!lastGroup) {
                    lastGroup = group('');
                    $scope.list.groups.push(lastGroup);
                }
                
                lastGroup.items.push(item(m[1]));
            } else {
                m = /^\s*(.+)\s*$/g.exec(line);
                console.log("Group regex match: " + m);
                if (m && m[1].length > 0) {
                    lastGroup = group(m[1]);
                    $scope.list.groups.push(lastGroup);
                }
            }                
        });
        
        $scope.flashSaved();
    }
    
    function bindList(listId) {
        var currentListRef = listsRef.child(listId);
        angularFire(currentListRef, $scope, 'list');
        rawChanged = false;
    }
    
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
