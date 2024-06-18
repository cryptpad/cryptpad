// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([], function () {
    var Condorcet = {};

    // Creates every possible combination pair of given options
    var getPermutations = function(array, size) {

        var result = [];

        var generatePermutations = function (t, i) {
            if (t.length === size) {
                result.push(t);
                result.push(t.slice().reverse());
                return;
            }
            if (i >= array.length) {
                return;
            }
            generatePermutations(t.concat(array[i]), i + 1);
            generatePermutations(t, i + 1);
        };

        generatePermutations([], 0);
        return result;
    };

    Condorcet.showCondorcetWinner = function (method, optionArray, listOfLists) {

        var comparePairs = function () {
            var pairs = getPermutations(optionArray, 2);
            var pairDict = {};
            pairs.forEach(function (pair) {
                pairDict[pair] = 0;
                listOfLists.forEach(function(optionList) {
                    var idx1 = optionList.indexOf(pair[0]);
                    var idx2 = optionList.indexOf(pair[1]);
                    // Put missing options as last in the array
                    if (idx1 === -1) { idx1 = Infinity; }
                    if (idx2 === -1) { idx2 = Infinity; }
                    if (idx1 < idx2) { pairDict[pair] ++; }
                });
            });

            var pathDictionary = {};
            //Adds winner of each pairwise comparison to path
            pairs.forEach(function (pair) {
                var key1 = [pair[0], pair[1]].join();
                var key2 = [pair[1], pair[0]].join();
                if (pairDict[key1] > pairDict[key2]) {
                    pathDictionary[key1] = pairDict[key1] - pairDict[key2];
                } else if (pairDict[key2] > pairDict[key1]) {
                    pathDictionary[key2] = pairDict[key2] - pairDict[key1];
                }
            });
            return pathDictionary;
        };

        var schulzeMethod = function(optionArray) {

            var findWeakestPath = function(optionArray) {

                var pathDictionary = comparePairs(optionArray);

                //Iterates through paths between two options comparing the weakest edge to current score
                optionArray.forEach(function(option1) {
                    optionArray.forEach(function(option2) {
                        if (option1 === option2) {
                            return;
                        } else {
                            optionArray.forEach(function(option3){
                                if (option1 === option3 || option2 === option3) {
                                    return;
                                } else {
                                    var key1 = [option2, option3].join();
                                    var key2 = [option2, option1].join();
                                    var key3 = [option1, option3].join();
                                    var score;
                                    if (!pathDictionary[key1]) {
                                        score = 0;
                                    } else {
                                        score = pathDictionary[key1];
                                    }
                                    var path1;
                                    if (pathDictionary[key2]) {
                                        path1 = pathDictionary[key2];
                                    } else {
                                        path1 = 0;
                                    }
                                    var path2;
                                    if (pathDictionary[key3]) {
                                        path2 = pathDictionary[key3];
                                    } else {
                                        path2 = 0;
                                    }
                                    var weakestPath = Math.min(path1, path2);
                                    if (weakestPath > score) {
                                        pathDictionary[key1] = weakestPath;
                                    }
                                }
                            });
                        }
                    });
                });

                return pathDictionary;
            };

            var calculateWinner = function() {

                var pathDictionary = findWeakestPath(optionArray);

                //Calculate scores for each option and select winner
                var winningMatches = {};
                optionArray.forEach(function(option){
                    winningMatches[option] = 0;
                });
                Object.keys(pathDictionary).forEach(function(pair) {
                    var option1 = pair.split(',')[0];
                    var option2 = pair.split(',')[1];
                    winningMatches[option1] ++;
                    winningMatches[option2] --;

                    Object.keys(pathDictionary).forEach(function(p) {
                        if (p.split(',')[1] === option1 && pathDictionary[p] > pathDictionary[pair]) {
                            winningMatches[option1] --;
                        }
                    });
                });
                var rankedResults = {};
                Object.keys(winningMatches).forEach(function(option) {
                    if (rankedResults[winningMatches[option]]) {
                        rankedResults[winningMatches[option]].push(option);
                    } else {
                        rankedResults[winningMatches[option]] = [option];
                    }
                });

                var losing = [];
                var winning = [];
                var winningPairs = [];
                Object.keys(pathDictionary).forEach(function(pair) {
                    var option1 = pair.split(',')[0];
                    var option2 = pair.split(',')[1];

                    losing.push(option2);
                    winning.push(option1);

                });
                Object.keys(pathDictionary).forEach(function(pair) {
                    var option1 = pair.split(',')[0];
                    if (!losing.includes(option1)) {
                        winningPairs.push(option1);
                    }
                });

                var winner;
                var winnersArray = [];

                winningPairs.forEach(function(pair) {
                    if (!winnersArray.includes(pair)) {
                        winnersArray.push(pair);
                    }
                });

                var sortedRankedResults = [];
                Object.keys(rankedResults).map(Number).sort(function(a, b){return a - b;}).forEach(function(score) {
                    sortedRankedResults.push([score, rankedResults[score]]);
                });


                if (winnersArray.length !== 0) {
                    winner = winnersArray;
                } else if (winnersArray.length === 0 && Object.keys(rankedResults).length === 1) {
                    winner = [];
                } else {
                    var maxScore = Math.max.apply(null, Object.keys(rankedResults));
                    winner = rankedResults[maxScore];
                }
                return [winner, sortedRankedResults];
            };
            return(calculateWinner());
        };

        var rankedPairsMethod = function (optionArray) {

            //'Locks' pairwise comparisons which do not create a beatpath cycle
            var pathDictionary = comparePairs();

            var items = Object.keys(pathDictionary).map(function(key) {
                return [key, pathDictionary[key]];
            });
            var itemsDict = {};
            Object.values(items).forEach(function(value) {
                if (itemsDict[value[1]]) {
                    itemsDict[value[1]].push(value[0]);
                } else {
                    itemsDict[value[1]] = [];
                    itemsDict[value[1]].push(value[0]);
                }

            });

            var sortedArray = [];
            Object.keys(itemsDict).map(Number).sort(function(a, b){return a - b;}).forEach(function(score) {
                sortedArray.push([score, itemsDict[score]]);
            });

            var rankingDict = {};
            var winning = [];
            var losing = [];
            sortedArray.forEach(function(arr) {
                arr[1].forEach(function(pair) {
                    winning.push(pair.split(',')[0]);
                    losing.push(pair.split(',')[1]);
                });
            });
            optionArray.forEach(function(option){
                rankingDict[option] = 0;
            });

            var rankingArray = [];
            Object.values(rankingDict).forEach(function(pair) {
                if (!rankingArray .includes(pair)) {
                    rankingArray .push(pair);
                }
            });

            if (rankingArray.length <= 1) {
                optionArray.forEach(function(option){
                    if (winning.includes(option)) {
                        rankingDict[option] ++;
                    }
                    if (losing.includes(option)) {
                        rankingDict[option] --;
                    }
                });
            }

            var rankedResults = {};
            Object.keys(rankingDict).forEach(function(option) {
                if (rankedResults[rankingDict[option]]) {
                    rankedResults[rankingDict[option]].push(option);
                } else {
                    rankedResults[rankingDict[option]] = [option];
                }
            });

            var rankedKeys = Object.keys(rankedResults).map(function(key) {
                return [key, rankedResults[key]];
            });

            var finalsortedItems = {};
            Object.values(rankedKeys).forEach(function(value){
                if (finalsortedItems[value[1]]) {
                    finalsortedItems[value[1]].push(value[0]);
                } else {
                    finalsortedItems[value[1]] = [value[0]];
                }
            });

            var finalRankingArray = [];
            Object.values(rankingDict).forEach(function(pair) {
                if (!finalRankingArray.includes(pair)) {
                    finalRankingArray.push(pair);
                }
            });

            var winner;
            if (finalRankingArray.length > 1) {
                var maxScore = Math.max.apply(null, Object.keys(rankedResults));
                winner = rankedResults[maxScore];
            } else if (sortedArray.length === 0) {
                winner = [];
            } else {
                var topScoring = sortedArray.slice(-1);
                topScoring.forEach(function(pair) {
                    pair[1].forEach(function(p) {
                        var index = winning.indexOf(p.split(',')[1]);
                        winning.splice(index, 1);
                    });
                });

                var winnerArray = [];
                winning.forEach(function(option){
                    if (!winnerArray.includes(option)) {
                        winnerArray.push(option);
                    }
                });

                if (winnerArray.length === optionArray.length) {
                    winner = [];
                } else {
                    winner = winnerArray;
                }
            }

            var sortedRankedResults = [];
            Object.keys(rankedResults).map(Number).sort(function(a, b){return a - b;}).forEach(function(score) {
                sortedRankedResults.push([score, rankedResults[score]]);
            });
            return [winner, sortedRankedResults];

        };

        var pickMethod = function (optionArray){
            if (method === "schulze") {
                return schulzeMethod(optionArray);
            } else if (method === "ranked") {
                return rankedPairsMethod(optionArray);
            }
        };
        return pickMethod(optionArray);
    };

    return Condorcet;
});
