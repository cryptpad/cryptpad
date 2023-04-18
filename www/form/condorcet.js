
define([], function () {
    var Condorcet = {};

    // Creates every possible combination pair of given options
    var getPermutations = function(array, size) {

        var result = [];

        function p(t, i) {
            if (t.length === size) {
                result.push(t);
                result.push(t.slice().reverse());
                return;
            }
            if (i >= array.length) {
                return;
            }
            p(t.concat(array[i]), i + 1);
            p(t, i + 1);
        }

        p([], 0);
        return result;
    };

    Condorcet.showCondorcetWinner = function(_answers, opts, uid, form, optionArray, listOfLists) {
        
        var comparePairs = function() {

            var pairs = getPermutations(optionArray, 2);
            var pairDict = {};
            pairs.forEach(function (pair) {                        
                pairDict[pair] = 0;
                listOfLists.forEach(function(optionList) {
                    if (optionList.indexOf(pair[0]) < optionList.indexOf(pair[1])) {
                        pairDict[pair] ++;
                    }
                });
            });

            var pathDictionary = {};
            //Adds winner of each pairwise comparison to path
            optionArray.forEach(function(option1) {
                optionArray.forEach(function(option2){
                    if (option1 !== option2) {
                        var key1 = [option1, option2].join();
                        var key2 = [option2, option1].join();
                        if (pairDict[key1] > pairDict[key2]) {
                            pathDictionary[key1] = pairDict[key1]; 
                        } else if (pairDict[key2] > pairDict[key1]) {
                            pathDictionary[key2] = pairDict[key2];
                        }
                    }
                });
            });
            return pathDictionary;
        };
    
        var schulzeMethod = function(optionArray) {
    
            var findWeakestPath = function(optionArray) {

                var pathDictionary = comparePairs(optionArray);

                //Iterates through paths between two options comparing the weakest edge to current score
                optionArray.forEach(function(option1) {
                    optionArray.forEach(function(option2) {
                        if (option1 !== option2) {
                            optionArray.forEach(function(option3){
                                if (option1 !== option3 && option2 !== option3) {
                                    var key1 = [option2, option3].join();
                                    var key2 = [option2, option1].join();
                                    var key3 = [option1, option3].join();
                                    var score;
                                    if (pathDictionary[key1] === undefined) {
                                        score = 0;
                                    } else {
                                        score = pathDictionary[key1];
                                    }
                                    var path1;
                                    if (pathDictionary[key2] !== undefined) {
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
                if (Object.keys(rankedResults).includes(winningMatches[option].toString())) {
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

                if (winnersArray.length !== 0) {
                    winner = winnersArray;
                } else if (winnersArray.length === 0 && Object.keys(rankedResults).length === 1) {
                    winner = [];
                } else {
                    winner = rankedResults[0];
                }
                
                return [winner, rankedResults];
            };
            return(calculateWinner());
        };
    
        var rankedPairsMethod = function (optionArray, listOfLists) {

            var pairs = getPermutations(optionArray, 2);
            
            //'Locks' pairwise comparisons which do not create a beatpath cycle
            var pathDictionary = comparePairs(listOfLists, pairs);

            var items = Object.keys(pathDictionary).sort().map(function(key) {
                return [key, pathDictionary[key]];
            });
            var sortedItems = {};
            Object.values(items).forEach(function(value) {
                if (Object.keys(sortedItems).includes(value[1].toString())) {
                    sortedItems[value[1]].push(value[0]);
                } else {
                    sortedItems[value[1]] = [];
                    sortedItems[value[1]].push(value[0]);
                }
                
            });

            var rankingDict = {};
            var winning = [];
            var losing = [];

            Object.values(sortedItems).forEach(function(v) {
                v.forEach(function(val){
                    winning.push(val.split(',')[0]);
                    losing.push(val.split(',')[1]);
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
            var winner;
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
            if (Object.keys(rankedResults).includes(rankingDict[option].toString())) {
                rankedResults[rankingDict[option]].push(option);
            } else {
                rankedResults[rankingDict[option]] = [option];
            }
            });

            var rankedKeys = Object.keys(rankedResults).sort().map(function(key) {
                return [key, rankedResults[key]];
            });
            
            var finalsortedItems = {};
            Object.values(rankedKeys).forEach(function(value){
                if (Object.keys(finalsortedItems).includes(value[1].toString())) {
                    finalsortedItems[value[1]].push(value[0]);
                } else {
                    finalsortedItems[value[1]] = [];
                    finalsortedItems[value[1]].push(value[0]);
                } 
            });

            var finalRankingArray = [];
            Object.values(rankingDict).forEach(function(pair) {
                if (!finalRankingArray.includes(pair)) {
                    finalRankingArray.push(pair);
                }
            });

            if (finalRankingArray.length > 1) {
                var maxScore = Math.max.apply(null, Object.keys(rankedResults));
                winner = rankedResults[maxScore];
            } else if (Object.keys(sortedItems).length === 0) {
                winner = [];
            } else {
                var index = Array.apply(null, Array(Object.keys(sortedItems).length-1)).map(function (_, i) { return i; });
                index.forEach(function(i) {
                    pairs = Object.values(sortedItems).reverse()[i];
                    pairs.forEach(function(pair) {
                        var valIndex = winning.indexOf(pair.split(',')[1]);
                        winning.splice(valIndex, 1);
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

            return [winner, rankedResults];
    
        };
    
        var pickMethod = function(optionArray, listOfLists, _answers, uid){
            var condorcetWinner = [];
            var schulzeWinner = schulzeMethod(optionArray, listOfLists, _answers, uid);
            var rankedPairWinner = rankedPairsMethod(optionArray, listOfLists);
            var method = form[uid].condorcetmethod;
            if (method === "schulze") {
                condorcetWinner = schulzeWinner;
            } else if (method === "ranked") {
                condorcetWinner = rankedPairWinner;
            }
            return condorcetWinner;
        };
        return pickMethod(optionArray, listOfLists, _answers, uid);
    };

    return Condorcet;
});

